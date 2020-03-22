const savedAlbum = require('./../models/savedAlbumModel');
const savedTrack = require('./../models/savedTrackModel');
const Track = require('./../models/trackModel');
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.saveAlbumsForCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide album ids', 400));
  }
  const albumIds = req.query.ids.split(',');
  const albums = await Album.find({ _id: { $in: albumIds } });
  if (albums.length < 1) {
    return next(new AppError('No albums found', 404));
  }
  let filteredAlbumIds = [];
  albums.forEach(el => {
    filteredAlbumIds.push(el._id);
  });
  const currentlySavedAlbums = await savedAlbum.find({
    album: { $in: filteredAlbumIds }
  });
  currentlySavedAlbums.forEach(el => {
    for (let i = 0; i < filteredAlbumIds.length; i += 1) {
      if (String(el.album) === String(filteredAlbumIds[i])) {
        filteredAlbumIds.splice(i, 1);
      }
    }
  });
  let savedAlbumDocs = [];
  filteredAlbumIds.forEach(el => {
    savedAlbumDocs.push({
      album: el,
      added_at: new Date(),
      user: req.user._id
    });
  });
  savedAlbum.create(savedAlbumDocs);
  res.status(201).send();
});

exports.saveTracksForCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide track ids', 400));
  }
  const trackIds = req.query.ids.split(',');
  const tracks = await Track.find({ _id: { $in: trackIds } });
  if (tracks.length < 1) {
    return next(new AppError('No tracks found', 404));
  }
  let filteredTrackIds = [];
  tracks.forEach(el => {
    filteredTrackIds.push(el._id);
  });
  const currentlySavedTracks = await savedTrack.find({
    track: { $in: filteredTrackIds }
  });
  currentlySavedTracks.forEach(el => {
    for (let i = 0; i < filteredTrackIds.length; i += 1) {
      if (String(el.track) === String(filteredTrackIds[i])) {
        filteredTrackIds.splice(i, 1);
      }
    }
  });
  let savedTrackDocs = [];
  filteredTrackIds.forEach(el => {
    savedTrackDocs.push({
      track: el._id,
      added_at: new Date(),
      user: req.user._id
    });
  });
  savedTrack.create(savedTrackDocs);
  res.status(201).send();
});

exports.getSavedAlbums = catchAsync(async (req, res, next) => {
  const offset = req.query.offset * 1 || 0;
  const limit =
    req.query.limit >= 1 && req.query.limit <= 50 ? req.query.limit * 1 : 20;
  const savedAlbums = await savedAlbum
    .find({ user: req.user._id })
    .select('-user -__v')
    .skip(offset)
    .limit(limit)
    .populate('album');
  const totalCount = await savedAlbum.count({ user: req.user._id });
  const nextPage =
    offset + limit <= totalCount
      ? `http://localhost:${
          process.env.PORT
        }/api/v1/me/albums/?offset=${offset + limit}&limit=${limit}`
      : null;
  const previousPage =
    offset - limit >= 0
      ? `http://localhost:${
          process.env.PORT
        }/api/v1/me/albums/?offset=${offset - limit}&limit=${limit}`
      : null;
  res.status(200).json({
    href: `http://localhost:${process.env.PORT}/api/v1/me${req.url}`,
    items: savedAlbums,
    limit,
    next: nextPage,
    offset,
    previous: previousPage,
    total: totalCount
  });
});
exports.getSavedTracks = catchAsync(async (req, res, next) => {
  const offset = req.query.offset * 1 || 0;
  const limit =
    req.query.limit >= 1 && req.query.limit <= 50 ? req.query.limit * 1 : 20;
  const savedTracks = await savedTrack
    .find({ user: req.user._id })
    .select('-user -__v')
    .skip(offset)
    .limit(limit)
    .populate('track');
  const totalCount = await savedTrack.count({ user: req.user._id });
  const nextPage =
    offset + limit <= totalCount
      ? `http://localhost:${
          process.env.PORT
        }/api/v1/me/tracks/?offset=${offset + limit}&limit=${limit}`
      : null;
  const previousPage =
    offset - limit >= 0
      ? `http://localhost:${
          process.env.PORT
        }/api/v1/me/tracks/?offset=${offset - limit}&limit=${limit}`
      : null;
  res.status(200).json({
    href: `http://localhost:${process.env.PORT}/api/v1/me${req.url}`,
    items: savedTracks,
    limit,
    next: nextPage,
    offset,
    previous: previousPage,
    total: totalCount
  });
});

exports.checkUserSavedAlbums = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide album ids', 400));
  }
  const albumIds = req.query.ids.split(',');
  const currentlySavedAlbums = await savedAlbum.find({
    album: { $in: albumIds }
  });
  let boolArray = [];
  currentlySavedAlbums.forEach(el => {
    for (let i = 0; i < albumIds.length; i += 1) {
      if (String(el.album) === String(albumIds[i])) {
        boolArray.push(true);
      } else {
        boolArray.push(false);
      }
    }
  });
  res.status(200).json(boolArray);
});

exports.checkUserSavedTracks = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide album ids', 400));
  }
  const trackIds = req.query.ids.split(',');
  const currentlySavedTracks = await savedTrack.find({
    track: { $in: trackIds }
  });
  let boolArray = [];
  currentlySavedTracks.forEach(el => {
    for (let i = 0; i < trackIds.length; i += 1) {
      if (String(el.track) === String(trackIds[i])) {
        boolArray.push(true);
      } else {
        boolArray.push(false);
      }
    }
  });
  res.status(200).json(boolArray);
});

exports.removeUserSavedTrack = catchAsync(async (req, res, next) => {
  const trackIds = req.query.ids.split(',');
  await savedTrack.deleteMany(
    { track: { $in: trackIds } },
    { user: req.user._id }
  );
  res.status(200).send();
});

exports.removeUserSavedAlbum = catchAsync(async (req, res, next) => {
  const albumIds = req.query.ids.split(',');
  await savedAlbum.deleteMany(
    { album: { $in: albumIds } },
    { user: req.user._id }
  );
  res.status(200).send();
});

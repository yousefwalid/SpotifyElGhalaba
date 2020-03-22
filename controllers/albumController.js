const mongoose = require('mongoose');
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const Track = require('./../models/trackModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAlbum = catchAsync(async (req, res, next) => {
  const album = await Album.findById(req.params.id).populate('tracks');
  if (!album) {
    return next(new AppError('No album found with that ID', 404));
  }
  res.status(200).json(album);
});

exports.getAlbumTracks = catchAsync(async (req, res, next) => {
  const offset = req.query.offset * 1 || 0;
  const limit =
    req.query.limit >= 1 && req.query.limit <= 50 ? req.query.limit * 1 : 20;
  const Tracks = await Album.findById(req.params.id)
    .select('tracks')
    .populate('tracks');
  if (!Tracks) {
    next(new AppError('No Album found with this ID', 404));
  }
  const totalCount = Tracks.tracks.length;
  const limitedTracks = Tracks.tracks.slice(offset, limit + offset);
  const nextPage =
    offset + limit <= totalCount
      ? `http://localhost:${process.env.PORT}/api/v1/albums/?offset=${offset +
          limit}&limit=${limit}`
      : null;
  const previousPage =
    offset - limit >= 0
      ? `http://localhost:${process.env.PORT}/api/v1/albums/?offset=${offset -
          limit}&limit=${limit}`
      : null;
  if (!Tracks) {
    return next(new AppError('No album found with that ID', 404));
  }
  res.status(200).json({
    href: `http://localhost:${process.env.PORT}/v1/albums${req.url}`,
    items: limitedTracks,
    limit,
    next: nextPage,
    offset,
    previous: previousPage,
    total: totalCount
  });
});

exports.getSeveralAlbums = catchAsync(async (req, res, next) => {
  let AlbumsIds = req.query.ids.split(',');
  if (AlbumsIds.length > 20) {
    AlbumsIds = AlbumsIds.slice(0, 20);
  }
  const Albums = await Album.find({ _id: { $in: AlbumsIds } });
  if (!Albums) {
    return next(new AppError('No albums found'), 404);
  }
  let albumList = [];
  AlbumsIds.forEach(el => {
    let found = false;
    for (let i = 0; i < Albums.length; i += 1) {
      if (el === Albums[i].id) {
        albumList.push(Albums[i]);
        found = true;
        break;
      }
    }
    if (!found) {
      albumList.push(null);
    }
  });
  res.status(200).json({
    Albums: albumList
  });
});

exports.createAlbum = catchAsync(async (req, res, next) => {
  if (req.user.type === 'user') {
    return next(new AppError('normal users cannot create albums'), 401);
  }
  const newAlbum = req.body;
  newAlbum.release_date = new Date();
  newAlbum.artists = req.user._id;

  await Album.create(newAlbum);
  res.status(201).json(newAlbum);
});

// exports.addSeveralTracksToAlbum = catchAsync(async (req, res, next) => {
//   const TracksSet = [...new Set(req.query.ids.split(','))];
//   console.log(TracksSet);
//   const Tracks = await Track.find({ _id: { $in: TracksSet } }).select('_id');
//   if (!Tracks) {
//     return next(new AppError('no tracks found', 404));
//   }
//   const returnedAlbum = await Album.findById(req.params.id);
//   Tracks.forEach(el => {
//     returnedAlbum.tracks.push(el._id);
//   });
//   await returnedAlbum.save();
//   res.status(200).json(Tracks);
// });

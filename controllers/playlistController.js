const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const filterDoc = require('./../utils/filterDocument');

exports.getPlaylist = catchAsync(async (req, res, next) => {
  const playlist = await Playlist.findById(req.params.playlist_id);

  if (!playlist) {
    return next(new AppError('No playlist found with that id', 404));
  }

  res.status(200).json(playlist);
});

exports.createPlaylist = catchAsync(async (req, res, next) => {
  req.body.owner = req.user;

  const newPlaylist = await Playlist.create(req.body);
  console.log(newPlaylist);

  res.status(201).json(newPlaylist);
});

exports.getPlaylistTracks = catchAsync(async (req, res, next) => {
  // const features = new APIFeatures(
  //   Playlist.findById(req.params.playlist_id).select('tracks.items'),
  //   req.query
  // )
  //   .filter()
  //   .sort()
  //   .limitFields()
  //   .skip();

  // const tracks = (await Playlist.findById(req.params.playlist_id).select(
  //   'tracks'
  // )).tracks;

  console.log(tracks);

  res.status(200).json({
    // tracks,
    // limit: features.queryString.limit,
    // offset: features.queryString.offset
  });
});

exports.getPlaylistImages = catchAsync(async (req, res, next) => {
  const images = (await Playlist.findById(req.params.playlist_id)).images;

  res.status(200).json(images);
});

exports.addPlaylistTrack = catchAsync(async (req, res, next) => {
  const playlist = await Playlist.findById(req.params.playlist_id);
  const uris = req.body.uris;
  const position = req.body.position * 1 || undefined;

  if (playlist.tracks.length + uris.length > 10000) {
    return new AppError("Playlist size can't exceed 10,000 tracks", 403);
  }

  uris.forEach(uri => {
    uri = uri.slice(14);

    const playlistTrack = {
      added_at: Date.now(),
      added_by: req.user,
      track: uri
    };

    playlist.tracks.items.push(playlistTrack);
  });

  playlist.save();

  res.status(201).send();
});

exports.getUserPlaylists = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Playlist.find({ owner: req.params.user_id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .skip();

  const playlists = await features.query;

  res.status(200).json(playlists);
});

exports.getMyUserPlaylists = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Playlist.find({ owner: req.user }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .skip();

  const playlists = await features.query;

  res.status(200).json(playlists);
});

exports.changePlaylistDetails = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'description', 'collaborative', 'public'];

  const bodyParams = req.body;

  Object.keys(bodyParams).forEach(el => {
    if (!allowedFields.includes(el)) delete bodyParams[el];
  });

  console.log(bodyParams);

  const playlist = await Playlist.findByIdAndUpdate(
    req.params.playlist_id,
    bodyParams,
    {
      new: true, // To return the new document after modification
      runValidators: true // To run the validators after updating the document
    }
  );

  if (!playlist) {
    return next(new AppError('No playlist found with that id', 404));
  }

  res.status(200).json(playlist);
});

const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

exports.getPlaylist = catchAsync(async (req, res, next) => {
  const playlist = await Playlist.findById(req.params.playlist_id);

  if (!playlist) {
    return next(new AppError('No playlist found with that id', 404));
  }

  res.status(200).json(playlist);
});

exports.createPlaylist = catchAsync(async (req, res, next) => {
  const newPlaylist = await Playlist.create(req.body);

  res.status(201).json(newPlaylist);
});

exports.getPlaylistTracks = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Playlist.findById(req.params.playlist_id).tracks,
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .skip();

  const tracks = await features.query;

  res.status(200).json({
    items: tracks,
    limit: features.queryString.limit,
    offset: features.queryString.offset
  });
});

const Track = require('./../models/trackModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.getTrack = catchAsync(async (req, res, next) => {
  const track = await Track.findById(req.params.id);
  if (!track) {
    return next(new AppError('No track found with that ID', 404));
  }
  res.status(200).json(track);
});

exports.createTrack = catchAsync(async (req, res, next) => {
  if (req.user.type === 'user') {
    return next(new AppError('normal users cannot create tracks'), 401);
  }
  const newTrack = req.body;
  await Track.create(newTrack);
  res.status(201).json(newTrack);
});

exports.getSeveralTracks = catchAsync(async (req, res, next) => {
  let trackIDs = req.query.ids.split(',');
  if (trackIDs.length > 20) {
    trackIDs = trackIDs.slice(0, 20);
  }
  const Tracks = await Track.find({ _id: { $in: trackIDs } });
  if (!Tracks) {
    return next(new AppError('No tracks found'), 404);
  }
  let trackList = [];
  trackIDs.forEach(el => {
    let found = false;
    for (let i = 0; i < Tracks.length; i += 1) {
      if (el === Tracks[i].id) {
        trackList.push(Tracks[i]);
        found = true;
        break;
      }
    }
    if (!found) {
      trackList.push(null);
    }
  });
  res.status(200).json({
    Tracks: trackList
  });
});

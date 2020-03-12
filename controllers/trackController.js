const Track = require('./../models/trackModel');
const AppError = require('./../utils/appError');

exports.getTrack = async (req, res, next) => {
  const track = await Track.findById(req.params.id);
  if (!track) {
    return next(new AppError('No track found with that ID'), 404);
  }
  res.status(200).json(track);
};

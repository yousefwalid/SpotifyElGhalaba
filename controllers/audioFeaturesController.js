const AudioFeatures = require('./../models/audioFeaturesModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.getAudioFeaturesForTrack = catchAsync(async (req, res, next) => {
  const trackAudioFeatures = await AudioFeatures.find({ track: req.params.id });
  if (!trackAudioFeatures) {
    return next(new AppError('there is no audio features for this track', 404));
  }
  res.status(200).json(trackAudioFeatures);
});

exports.getAudioFeaturesForSeveralTracks = catchAsync(
  async (req, res, next) => {
    let tracksIDs = req.query.ids.split(',');
    if (tracksIDs.length > 20) {
      tracksIDs = tracksIDs.slice(0, 20);
    }
    const audioFeatures = await AudioFeatures.find({
      track: { $in: tracksIDs }
    }).populate('tracks');
    if (!audioFeatures) {
      return next(new AppError('No audioFeatures found'), 404);
    }
    let audioFeaturesList = [];
    tracksIDs.forEach(el => {
      let found = false;
      for (let i = 0; i < audioFeatures.length; i += 1) {
        if (el == audioFeatures[i].track) {
          audioFeaturesList.push(audioFeatures[i]);
          found = true;
          break;
        }
      }
      if (!found) {
        audioFeaturesList.push(null);
      }
    });
    res.status(200).json({
      audioFeatures: audioFeaturesList
    });
  }
);
exports.addAudioFeaturesForTrack = catchAsync(async (req, res, next) => {
  const newAudioFeatures = req.body;
  await AudioFeatures.create(newAudioFeatures);
  res.status(201).json(newAudioFeatures);
});

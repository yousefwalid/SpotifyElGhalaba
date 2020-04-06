const AudioFeatures = require('./../models/audioFeaturesModel');
const Track = require('./../models/trackModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const filteredObj = require('./../utils/filterObject');
/**
 * This contains all the business logic for the audio-features controller
 * @module Audio-FeaturesController
 * @returns Audio-Features object
 */

/**
 * Get's audio features for a given track
 * @param {String} trackID -The id of the required track
 */
const getAudioFeaturesForTrack = async trackID => {
  const track = await Track.findById(trackID);
  if (!track) {
    throw new AppError('No track found with this ID', 404);
  }
  const trackAudioFeatures = await AudioFeatures.findOne({
    track: trackID
  });
  if (!trackAudioFeatures) {
    throw new AppError('there is no audio features for this track', 404);
  }
  return trackAudioFeatures;
};

/**
 *
 * @param {Array<String>} tracksIDs -Array of ids for the required tracks
 * @returns List of audio-features objects for the tracks
 */
const getAudioFeaturesForSeveralTracks = async tracksIDs => {
  if (req.query.ids == '') {
    throw new AppError('Please provide track IDs', 400);
  }
  let tracksIDs = req.query.ids.split(',');
  if (tracksIDs.length > 20) {
    tracksIDs = tracksIDs.slice(0, 20);
  }
  const audioFeatures = await AudioFeatures.find({
    track: { $in: tracksIDs }
  });
  let audioFeaturesList = [];
  tracksIDs.forEach(el => {
    let found = false;
    for (let i = 0; i < audioFeatures.length; i += 1) {
      if (String(el) == String(audioFeatures[i].track)) {
        audioFeaturesList.push(audioFeatures[i]);
        found = true;
        break;
      }
    }
    if (!found) {
      audioFeaturesList.push(null);
    }
  });
  return audioFeaturesList;
};

/**
 * Adds a new Audio-Features for a given track
 * @param {AudioFeatures} body -The audio-features object to be added to the track
 * @returns the added audio-features object
 */
const addAudioFeaturesForTrack = async body => {
  const allowedKeys = [
    'danceability',
    'energy',
    'key',
    'loudness',
    'mode',
    'speechiness',
    'acousticness',
    'instrumentalness',
    'liveness',
    'valence',
    'tempo',
    'type',
    'track',
    'duration_ms',
    'time_signature'
  ];
  const sanitizedObj = filteredObj(body, allowedKeys);
  const newAudioFeatures = sanitizedObj;
  const track = await Track.findById(body.track);
  if (!track) throw new AppError('No track found for this id', 404);
  await AudioFeatures.create(newAudioFeatures);
  return newAudioFeatures;
};

/* istanbul ignore next */
exports.getAudioFeaturesForTrack = catchAsync(async (req, res, next) => {
  const trackAudioFeatures = await getAudioFeaturesForTrack(req.params.id);
  res.status(200).json(trackAudioFeatures);
});

exports.getAudioFeaturesForSeveralTracks = catchAsync(
  async (req, res, next) => {
    const audioFeaturesList = await getAudioFeaturesForSeveralTracks(req);
    res.status(200).json({
      audioFeatures: audioFeaturesList
    });
  }
);

/* istanbul ignore next */
exports.addAudioFeaturesForTrack = catchAsync(async (req, res, next) => {
  const newAudioFeatures = await addAudioFeaturesForTrack(req.body);
  res.status(201).json(newAudioFeatures);
});

exports.addAudioFeaturesForTrackLogic = addAudioFeaturesForTrack;
exports.getAudioFeaturesForSeveralTracksLogic = getAudioFeaturesForSeveralTracks;
exports.getAudioFeaturesForTrackLogic = getAudioFeaturesForTrack;

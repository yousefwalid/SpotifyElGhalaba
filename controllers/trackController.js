const Track = require('./../models/trackModel');
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
/**
 * This contains all the business logic for the track controller
 * @module TrackController
 */

/**
 * Gets a track with a specific ID
 * @param {String} trackID - The id of the desired track
 * @returns {TrackObject} The track with the specified ID
 */
const getTrack = async trackID => {
  const track = await Track.findById(trackID);
  if (!track) {
    throw new AppError('No track found with that ID', 404);
  }
  return track;
};

/**
 * Gets several tracks based on the given IDs
 * @param {Array<Numbers>} trackIDs - List of required track ids
 * @returns {Array<TrackObject>} Array of the required tracks
 */

const getSeveralTracks = async trackIDs => {
  if (trackIDs.length > 20) {
    trackIDs = trackIDs.slice(0, 20);
  }
  //Returns the avaliable tracks IDs in the DB
  const Tracks = await Track.find({ _id: { $in: trackIDs } });
  if (Tracks.length < 1) {
    throw new AppError('No tracks found', 404);
  }
  //Iterate on the list of IDs and if not found add a null
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
  return trackList;
};

/**
 * Creates a track with the body passed to the function
 * @param {object} requestBody - The body of the request
 * @param {UserObject} currentUser -The logged in user data
 * @returns The created track object
 */

const createTrack = async (requestBody, currentUser) => {
  const newTrack = requestBody;
  newTrack.artists = currentUser._id;
  await Track.create(newTrack);
  return newTrack;
};
/**
 * Removes a track with a given ID
 * @param {String} trackID -The track ID to be deleted
 */
const removeTrack = async trackID => {
  const track = await Track.findById(trackID);
  const album = await Album.findById(track.album);
  if (!album) {
    throw new AppError('No album found with that ID', 404);
  }
  let index;
  let found = false;
  for (index = 0; index < album.tracks.length; index += 1) {
    if (String(album.tracks[index]) === String(trackID)) {
      found = true;
      break;
    }
  }
  if (found) {
    album.tracks.splice(index, 1);
  }
  await track.remove();
  await album.save();
};
exports.getTrack = catchAsync(async (req, res, next) => {
  const track = await getTrack(req.params.id);
  res.status(200).json(track);
});

exports.createTrack = catchAsync(async (req, res, next) => {
  const newTrack = createTrack(req.body, req.user);
  res.status(201).json(newTrack);
});

exports.getSeveralTracks = catchAsync(async (req, res, next) => {
  let trackIDs = req.query.ids.split(',');
  const trackList = await getSeveralTracks(trackIDs);
  res.status(200).json({
    Tracks: trackList
  });
});

exports.removeTrack = catchAsync(async (req, res, next) => {
  await removeTrack(req.params.id);
  res.status(200).send();
});
exports.getTrackLogic = getTrack;
exports.getSeveralTracksLogic = getSeveralTracks;
exports.createTrackLogic = createTrack;
exports.removeTrackLogic = removeTrack;

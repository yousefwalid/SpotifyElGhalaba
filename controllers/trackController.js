const Track = require('./../models/trackModel');
const Album = require('./../models/albumModel');
const Artist = require('./../models/artistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const filterObj = require('./../utils/filterObject');
const { ObjectId } = require('mongoose').Types;

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
 * @param {UserObject} userID -The logged in user data
 * @returns The created track object
 */

const createTrack = async (requestBody, userID) => {
  const reqObject = filterObj(requestBody, [
    'name',
    'album',
    'disc_number',
    'duration_ms',
    'explicit'
  ]);
  const newTrack = reqObject;
  const artist = await Artist.findOne({ userInfo: userID });

  if (!artist) throw new AppError('Artist not found', 404);
  newTrack.artists = [artist._id];

  const album = await Album.findById(newTrack.album);
  if (!album) throw new AppError('No album found with that ID', 404);

  const createdTrack = await Track.create(newTrack);
  return createdTrack;
};
/**
 * Sets a track active property with a given ID to false 
 * @param {String} trackID -The track ID to be deleted
 */
const removeTrack = async (trackID,userID) => {
  const artist=await Artist.findOne({userInfo:new ObjectId(userID)});
  const track=await Track.findById(trackID);

  if(!track)
    throw new AppError("No track was found with this ID",404);
  
  if(!track.artists.includes(artist.id))
    throw new AppError("Only the track artists can remove their track",403);
  
  await Track.findByIdAndUpdate(trackID,{active:false});

};

/**
 * Update a Track fields
 * @param {String} trackID -The track ID to be updated
 * @param {Document} object -The keys in the track that will be modified with their new values
 * @param {String} userID - The logged in user id
 */
const updateTrack = async (trackID, object, userID) => {
  const artist = await Artist.findOne({ userInfo: new ObjectId(userID) });
  const track = await Track.findById(trackID);
  if (!track) throw new AppError('No track found with this ID', 404);
  if (!track.artists.includes(artist.id))
    throw new AppError(
      'Only the Artist of the track can update the track info',
      403
    );

  const filteredObj = filterObj(object, [
    'name',
    'album',
    'duration_ms',
    'explicit',
    'disc_number'
  ]);

  if ('album' in filteredObj) {
    const oldAlbum = await Album.findById(track.album);
    const newAlbum = await Album.findById(new ObjectId(filteredObj.album));

    if (!newAlbum)
      throw new AppError('The album you specified does not exist', 404);

    if (!newAlbum.artists.includes(artist.id))
      throw new AppError(
        'Only the album artists can Add songs to their albums',
        403
      );

    const index = oldAlbum.tracks.indexOf(trackID);
    oldAlbum.tracks.splice(index, 1);
    newAlbum.tracks.push(trackID);
  
    await oldAlbum.save();
    await newAlbum.save();
  }
  const updatedTrack = await Track.findByIdAndUpdate(trackID,filteredObj,{new:true})
  return updatedTrack;
};
/**
 *  Takes a track ID and returns a link to that track
 * @param {String} trackID -The id of the track you want to share
 */
/* istanbul ignore next */
const shareTrack = async (req) => {
  console.log(req.params.id)
  const track = await Track.findById(req.params.id);
  if (!track)
    throw new AppError("The track you're looking for isn't found", 404);
  return `${process.env.DOMAIN_PRODUCTION}/track/${req.params.id}`;
};
/* istanbul ignore next */
exports.getTrack = catchAsync(async (req, res, next) => {
  const track = await getTrack(req.params.id);
  res.status(200).json(track);
});

/* istanbul ignore next */
exports.createTrack = catchAsync(async (req, res, next) => {
  const newTrack = await createTrack(req.body, req.user._id);
  res.status(201).json(newTrack);
});
/* istanbul ignore next */
exports.getSeveralTracks = catchAsync(async (req, res, next) => {
  if (req.query.ids == '') {
    return next(new AppError('Please provide track IDs', 400));
  }
  let trackIDs = req.query.ids.split(',');
  const trackList = await getSeveralTracks(trackIDs);
  res.status(200).json({
    Tracks: trackList
  });
});

/* istanbul ignore next */
exports.removeTrack = catchAsync(async (req, res) => {
  await removeTrack(req.params.id,req.user._id);
  res.status(200).send();
});
/*istanbul ignore next*/
exports.updateTrack = catchAsync(async (req, res) => {
  const updatedTrack = await updateTrack(req.params.id, req.body, req.user._id);
  res.status(200).send(updatedTrack);
});
/*istanbul ignore next*/
exports.shareTrack = catchAsync(async (req, res) => {
  const link = await shareTrack(req);
  res.status(200).json({
    "status":"success",
    link
  });
});

exports.getTrackLogic = getTrack;
exports.getSeveralTracksLogic = getSeveralTracks;
exports.createTrackLogic = createTrack;
exports.removeTrackLogic = removeTrack;
exports.updateTrackLogic = updateTrack;

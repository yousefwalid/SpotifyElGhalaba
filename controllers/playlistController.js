const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
var mongoose = require('mongoose');
const filterObj = require('./../utils/filterObject');
const parseFields = require('./../utils/parseFields');
const multer = require('multer');
const sharp = require('sharp');
const excludePopulationFields = require('./../utils/excludePopulationFields');

/**
 * @module PlaylistController
 */

/* Image uploading */

/**
 *  An object used for disk storage configurations of multer
 */

multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/playlists');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `playlist-${req.params.playlist_id}-${Date.now()}.${ext}`);
  }
});

/**
 * An object used for filtering images for multer
 */

multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image format', 400), false);
  }
};

/**
 *  Used to initalize the multer object with storage settings and filter
 */

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

/**
 * Validates the ranges of limit and offset
 * @param {Number} limit The limit parameter, defaults to 100 if not passed
 * @param {Number} offset The offset parameter, defaults to 0 if not passed
 */
const validateLimitOffset = (limit, offset) => {
  limit = limit * 1 || 100;
  offset = offset * 1 || 0;

  if (limit <= 0)
    throw new AppError(
      'Limit query parameter can not be less than or equal to 0',
      500
    );

  if (limit > 100)
    throw new AppError(
      'Limit query parameter can not be greater than 100',
      500
    );

  return { limit, offset };
};

/**
 * Authorizes if the user has access to the playlist
 * @param {String} userId The id of the user making the request
 * @param {String} playlistId The id of the playlist
 */
const authorizeUserToPlaylist = async (userId, playlistId) => {
  if (!userId || !playlistId)
    throw new AppError('userId or PlaylistId not specified', 500);

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new AppError('No playlist found with that id', 404);
  }

  if (!playlist.public) {
    // If user is not owner and not in the collaborators IF it is collaborative
    if (
      String(playlist.owner.id) != String(userId) &&
      !(
        playlist.collaborative == true &&
        playlist.collaborators.map(id => id.toString()).includes(String(userId))
      )
    ) {
      throw new AppError('You do not have access to this playlist', 403);
    }
  }
};

/**
 * Gets a Playlist given its id
 * @param {String} playlistId The id of the Playlist to be retrieved
 * @param {String} userId The id of the user making the request
 * @param {Object} queryParams The query parameters of the request
 * @returns {PlaylistObject}
 * @todo Handle different errors
 */

const getPlaylist = async (playlistId, userId, queryParams) => {
  let returnObj = excludePopulationFields(
    parseFields(queryParams.fields),
    'owner'
  );
  queryParams.fields = returnObj.fieldsString;
  const ownerPopulationFields = returnObj.trimmedString;

  returnObj = excludePopulationFields(
    parseFields(queryParams.fields),
    'tracks.items.track'
  );
  queryParams.fields = returnObj.fieldsString;
  const trackPopulationFields = returnObj.trimmedString;

  const features = new APIFeatures(
    Playlist.findById(playlistId)
      .populate('owner', ownerPopulationFields)
      .populate('tracks.items.track', trackPopulationFields),
    queryParams
  )
    .filterOne()
    .limitFieldsParenthesis();

  const playlist = await features.query;

  if (!playlist) {
    throw new AppError('No playlist found with that id', 404);
  }

  await authorizeUserToPlaylist(userId, playlistId);

  return playlist;
};

/**
 * Gets tracks of a certain playlist given its id
 * @param {String} playlistId The id of the playlist
 * @param {String} userId The id of the user making the request
 * @param {Object} queryParams The query parameters of the request
 * @returns {PagingObject}
 * @todo Handle unselecting limit and offset in limitFields
 * @todo Fix fields on population
 */

const getPlaylistTracks = async (playlistId, userId, queryParams) => {
  const { limit, offset } = validateLimitOffset(
    queryParams.limit,
    queryParams.offset
  );

  const returnObj = excludePopulationFields(
    parseFields(queryParams.fields),
    'items.track'
  );

  queryParams.fields = returnObj.fieldsString;
  const populationFields = returnObj.trimmedString;

  queryParams.fields = queryParams.fields.replace(/items/g, 'tracks.items'); // As the object in DB is tracks.items but in response it is items only

  const queryObject = { 'tracks.items': { $slice: [offset, limit] } }; // Apply slicing on offset and limit

  const features = new APIFeatures(
    Playlist.findById(playlistId, queryObject).populate(
      'tracks.items.track',
      populationFields
    ),
    queryParams
  )
    .filterOne()
    .limitFieldsParenthesis();

  const tracks = await features.query;

  let pagingObject = {
    href: 'https://api.spotify.com/v1/' + `playlists/${playlistId}/tracks`,
    items: tracks.tracks.items,
    limit,
    offset
  };

  await authorizeUserToPlaylist(userId, playlistId);

  return pagingObject;
};

/**
 * Adds a list of tracks into a playlist given its id, can have a position specified to insert the tracks at
 * @param {String} playlistId The id of the playlist
 * @param {Array<String>} uris An array of the Spotify track URIs to add
 * @param {Number} position The position to insert the tracks, a zero-based index
 * @param {String} userId The id of the user issuing the request
 * @returns {null}
 * @todo test errors
 */

const addPlaylistTrack = async (playlistId, uris, position, userId) => {
  if (!uris || uris.length == 0) {
    throw new AppError('No URIs specified', 400);
  }

  if (!userId) {
    throw new AppError('A user must be passed', 500);
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new AppError('No playlist found with that id', 404);
  }

  await authorizeUserToPlaylist(userId, playlistId);

  if (playlist.tracks.length + uris.length > 10000) {
    throw new AppError("Playlist size can't exceed 10,000 tracks", 403);
  }

  let playlistTracks = []; // Temporary array to create

  uris.forEach(uri => {
    // Crop the track id out of the uri
    uri = uri.slice(14);

    const playlistTrack = {
      // Create a new PlaylistTrackObject
      added_at: Date.now(),
      added_by: userId,
      track: uri
    };

    playlistTracks.push(playlistTrack); // Push the items in the playlist tracks array
  });

  if (position == undefined)
    playlist.tracks.items = playlist.tracks.items.concat(playlistTracks);
  else {
    const tempArray = playlist.tracks.items.splice(position);
    playlist.tracks.items = playlist.tracks.items.concat(playlistTracks);
    playlist.tracks.items = playlist.tracks.items.concat(tempArray);
  }

  playlist.save(); // Save the document
};

/**
 * Retrieve a list of a playlists for a certain user
 * @param {String} userId The id of the user to have his playlists retrieved
 * @param {Object} queryParams The query parameters of the request
 * @returns {Array<PlaylistObject>}
 */

const getUserPlaylists = async (userId, queryParams) => {
  queryParams.limit = queryParams.limit * 1 || 20;
  queryParams.offset = queryParams.offset * 1 || 0;

  if (queryParams.limit < 0 || queryParams.limit > 50)
    throw new AppError('Limit query parameter out of allowed range', 400);

  if (queryParams.offset < 0 || queryParams.offset > 100000)
    throw new AppError('Offset query parameter out of allowed range', 400);

  const features = new APIFeatures(
    Playlist.find({ owner: userId }),
    queryParams
  )
    .filter()
    .skip();

  const playlists = await features.query;

  return playlists;
};

/**
 * Change the details of a playlist given its id and the attributes to be changed
 * @param {Object} bodyParams An object containing the details of the new playlist
 * @param {String} playlistId The id of the playlist to be edited
 * @param {String} userId the id of the user issuing the request
 * @return {PlaylistObject}
 */
const changePlaylistDetails = async (bodyParams, playlistId, userId) => {
  const playlistOwner = await Playlist.findById(playlistId);

  if (!playlistOwner) throw new AppError('No playlist found with that id', 404);

  if (String(playlistOwner.owner) != userId) {
    throw new AppError('You are not authorized to edit this playlist', 403);
  }

  const allowedFields = ['name', 'description', 'collaborative', 'public'];

  bodyParams = filterObj(bodyParams, allowedFields);

  const playlist = await Playlist.findByIdAndUpdate(playlistId, bodyParams, {
    new: true, // To return the new document after modification
    runValidators: true // To run the validators after updating the document
  });

  return playlist;
};

/**
 * Delete tracks from playlist given its id
 * requestTracks can have tracks with ID only or tracks with ID and positions specified
 * @param {String} playlistId The id of the playlist
 * @param {String} userId The id of the user issuing the request
 * @param {Object} requestTracks An object containing a tracks array which contains list of ids of tracks and their positions(optional)
 * @returns {None}
 */

const deletePlaylistTrack = async (playlistId, userId, requestTracks) => {
  if (!requestTracks || requestTracks.length === 0)
    throw new AppError('Invalid Request Body', 400);

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) throw new AppError('No playlist found with that ID', 404);

  if (String(playlist.owner) != userId)
    throw new AppError(
      'You are not authorized to modify this playlist as you are not the owner',
      403
    );

  const tracks = playlist.tracks;

  if (!tracks) throw new AppError('This playlist contains no tracks', 404);

  // 1) For each track in the request, verify that the position specified actually contains that track

  requestTracks.forEach(track => {
    if (track.positions) {
      track.positions.forEach(pos => {
        if (!tracks.items[pos] || tracks.items[pos].track != track.id) {
          throw new AppError(
            'A track does not exist at the specified position',
            400
          );
        }
      });
    }
  });

  // 2) Delete all tracks with position specified

  var toBeDeletedIDsWithPos = [];
  requestTracks.forEach(track => {
    if (track.positions) {
      track.positions.forEach(pos => {
        toBeDeletedIDsWithPos.push(tracks.items[pos]._id);
      });
    }
  });

  // Remove all tracks from playlist where tracks._id is $in toBeDeletedIDsWithPos

  await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { 'tracks.items': { _id: { $in: toBeDeletedIDsWithPos } } }
    },
    { multi: true }
  );

  // 3) Delete all tracks with no position specified

  var toBeDeletedIDsWithoutPos = [];

  requestTracks.forEach(track => {
    if (!track.positions) {
      toBeDeletedIDsWithoutPos.push(track.id);
    }
  });

  // Remove all tracks from playlist where tracks.track.uri is $in toBeDeletedIDsWithoutPos
  await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        'tracks.items': {
          track: { $in: toBeDeletedIDsWithoutPos }
        }
      }
    },
    { multi: true }
  );
};

/**
 * Saves the image file data of a certain playlist to the database
 * @param {String} playlistId The id of the playlist
 * @param {Object} requestFile The image file saved
 */
const addPlaylistImage = async (playlistId, requestFile) => {
  const url = './' + requestFile.destination + '/' + requestFile.filename;

  await sharp(url)
    .metadata()
    .then(function(metadata) {
      requestFile.width = metadata.width;
      requestFile.height = metadata.height;
    });

  const imageObj = {
    url: url,
    width: requestFile.width,
    height: requestFile.height
  };

  await Playlist.findByIdAndUpdate(playlistId, {
    $set: { images: [imageObj] }
  });
};

/**
 * Reorder a track or a group of tracks in a playlist
 * @param {String} playlistId The id of the playlist
 * @param {Number} range_start The position of the first track to be reordered
 * @param {Number} range_length The amount of tracks to be reordered. Defaults to 1 if not set. The range of tracks to be reordered begins from the range_start position, and includes the range_length subsequent tracks.
 * @param {Number} insert_before The position where the tracks should be inserted. To reorder the tracks to the end of the playlist, simply set insert_before to any position after the last track.
 * @returns {None}
 */

const reorderPlaylistTracks = async (
  playlistId,
  range_start,
  range_length,
  insert_before
) => {
  range_length = range_length * 1 || 1;

  if (
    (!range_start && range_start !== 0) ||
    !range_length ||
    (!insert_before && insert_before !== 0) ||
    range_start < 0 ||
    range_length < 0 ||
    insert_before < 0
  )
    throw new AppError('Please specify all parameters correctly', 500);

  if (
    insert_before >= range_start &&
    insert_before < range_length + range_start
  ) {
    throw new AppError(
      'insert_before cannot lie between range_start and range_start + range_length',
      500
    );
  }

  let playlistTracksArray = (await Playlist.findById(playlistId).select(
    'tracks'
  )).tracks.items;

  const omittedArray = playlistTracksArray.splice(range_start, range_length);

  if (insert_before >= range_start + range_length)
    insert_before -= range_length;

  const secondHalf = playlistTracksArray.splice(insert_before);

  playlistTracksArray = playlistTracksArray.concat(omittedArray);
  playlistTracksArray = playlistTracksArray.concat(secondHalf);

  await Playlist.findByIdAndUpdate(playlistId, {
    'tracks.items': playlistTracksArray
  });
};

exports.getPlaylist = catchAsync(async (req, res, next) => {
  const playlist = await getPlaylist(
    req.params.playlist_id,
    req.user._id,
    req.query
  );

  res.status(200).json(playlist);
});

exports.getPlaylistTracks = catchAsync(async (req, res, next) => {
  const tracks = await getPlaylistTracks(
    req.params.playlist_id,
    req.user._id,
    req.query
  );

  res.status(200).json(tracks);
});

exports.getPlaylistImages = catchAsync(async (req, res, next) => {
  if (!req.params.playlist_id)
    return next(new AppError('Playlist Id not specified', 400));

  const playlist = await Playlist.findById(req.params.playlist_id);

  if (!playlist)
    return next(new AppError('No playlist found with that id', 404));

  const images = playlist.images;

  res.status(200).json(images);
});

exports.createPlaylist = catchAsync(async (req, res, next) => {
  req.body.owner = req.user;
  const newPlaylist = await Playlist.create(req.body);

  res.status(201).json(newPlaylist);
});

exports.addPlaylistTrack = catchAsync(async (req, res, next) => {
  addPlaylistTrack(
    req.params.playlist_id,
    req.body.uris,
    req.body.position,
    req.user._id
  );

  res.status(201).send();
});

exports.getUserPlaylists = catchAsync(async (req, res, next) => {
  const playlists = await getUserPlaylists(req.params.user_id, req.query);

  res.status(200).json(playlists);
});

exports.getMyUserPlaylists = catchAsync(async (req, res, next) => {
  const playlists = await getUserPlaylists(req.user._id, req.query);

  res.status(200).json(playlists);
});

exports.changePlaylistDetails = catchAsync(async (req, res, next) => {
  const playlist = await changePlaylistDetails(
    req.body,
    req.params.playlist_id,
    req.user._id
  );

  res.status(200).json(playlist);
});

exports.deletePlaylistTrack = catchAsync(async (req, res, next) => {
  await deletePlaylistTrack(
    req.params.playlist_id,
    req.user._id,
    req.body.tracks
  );

  res.status(200).send();
});

exports.addPlaylistImage = catchAsync(async (req, res, next) => {
  await addPlaylistImage(req.params.playlist_id, req.file);

  res.status(202).send();
});

exports.reorderPlaylistTracks = catchAsync(async (req, res, next) => {
  await reorderPlaylistTracks(
    req.params.playlist_id,
    req.body.range_start,
    req.body.range_length,
    req.body.insert_before
  );

  res.status(200).send();
});

exports.uploadPlaylistImage = upload.single('photo');

const multer = require('multer');
const sharp = require('sharp');
const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const filterObj = require('./../utils/filterObject');
const parseFields = require('./../utils/parseFields');
const excludePopulationFields = require('./../utils/excludePopulationFields');
const jsonToPrivateUser = require('../utils/jsonToPublicUser');
const uploadAWSImage = require('./../utils/uploadAWSImage');
const User = require('./../models/userModel');
const followController = require('./followController');
/**
 * @module PlaylistController
 */

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
      400
    );

  if (limit > 100)
    throw new AppError(
      'Limit query parameter can not be greater than 100',
      400
    );

  return { limit, offset };
};

/**
 * Authorizes if the user has access to the playlist
 * and also handles bad requests and not found errors
 * @param {String} userId The id of the user making the request
 * @param {String} playlistId The id of the playlist
 */
const authorizeUserToPlaylist = async (userId, playlistId) => {
  if (!userId || !playlistId)
    throw new AppError('User id or Playlist id not specified', 400);

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new AppError('No playlist found with that id', 404);
  }

  if (!playlist.public) {
    // If user is not owner and not in the collaborators IF it is collaborative
    if (
      String(playlist.owner._id) !== String(userId) &&
      !(
        playlist.collaborative === true &&
        playlist.collaborators.map(id => id.toString()).includes(String(userId))
      )
    ) {
      throw new AppError('You do not have access to this playlist', 403);
    }
  }

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
  await authorizeUserToPlaylist(userId, playlistId);
  if (!queryParams) {
    queryParams = {};
  }

  const { limit, offset } = validateLimitOffset(
    queryParams.limit,
    queryParams.offset
  );

  let returnObj;
  let populationFields;

  if (queryParams && queryParams.fields) {
    returnObj = excludePopulationFields(
      parseFields(queryParams.fields),
      'items.track'
    );
    queryParams.fields = returnObj.fieldsString;
    populationFields = returnObj.trimmedString;

    queryParams.fields = queryParams.fields.replace(/items/g, 'tracks.items'); // As the object in DB is tracks.items but in response it is items only
  }

  const queryObject = { 'tracks.items': { $slice: [offset, limit] } }; // Apply slicing on offset and limit

  const features = new APIFeatures(
    Playlist.findById(playlistId, queryObject)
      //.populate('tracks.items.track', populationFields)
      .populate([
        {
          path: 'tracks.items.track',
          select: populationFields,
          populate: [
            {
              path: 'album',
              select:
                'album_type artists id images name type uri external_urls href',
              populate: {
                path: 'artists',
                select: 'external_urls href id name type uri'
              }
            },
            {
              path: 'artists',
              select: 'external_urls href id name type uri'
            }
          ]
        },
        {
          path: 'tracks.items.added_by',
          select: 'name id type uri href'
        }
      ]),
    queryParams
  )
    .filterOne()
    .limitFieldsParenthesis();

  const tracks = await features.query;

  const pagingObject = {
    href: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    items: tracks.tracks.items,
    limit,
    offset
  };

  return pagingObject;
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
  await authorizeUserToPlaylist(userId, playlistId);

  let returnObj;
  let ownerPopulationFields;
  let trackQueryFields;

  if (queryParams && queryParams.fields) {
    returnObj = excludePopulationFields(
      parseFields(queryParams.fields),
      'owner'
    );
    queryParams.fields = returnObj.fieldsString;
    ownerPopulationFields = returnObj.trimmedString;

    returnObj = excludePopulationFields(
      parseFields(queryParams.fields),
      'tracks'
    );
    queryParams.fields = returnObj.fieldsString;
    trackQueryFields = returnObj.trimmedString.split(' ').join(', ');
  }

  const tracksQueryParams = {};

  tracksQueryParams.fields = trackQueryFields;
  tracksQueryParams.limit = 100;
  tracksQueryParams.offset = 0;

  const tracks = await getPlaylistTracks(playlistId, userId, tracksQueryParams);

  const features = new APIFeatures(
    Playlist.findById(playlistId).populate('owner', ownerPopulationFields),
    queryParams
  )
    .filterOne()
    .limitFieldsParenthesis();

  const playlist = await features.query;

  // if (!playlist) {
  //   throw new AppError('No playlist found with that id', 404);
  // }

  const playlistObject = playlist.toObject();

  playlistObject.owner = jsonToPrivateUser(playlistObject.owner);
  playlistObject.tracks = tracks;

  return playlistObject;
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

const addPlaylistTrack = async (playlistId, userId, ids, position) => {
  if (!ids || ids.length === 0) {
    throw new AppError('No IDs specified', 400);
  }

  const playlist = await authorizeUserToPlaylist(userId, playlistId);
  if ((playlist.tracks.length || 0) + ids.length > 10000) {
    throw new AppError("Playlist size can't exceed 10,000 tracks", 403);
  }

  const playlistTracks = []; // Temporary array to create

  ids.forEach(id => {
    const playlistTrack = {
      // Create a new PlaylistTrackObject
      added_at: Date.now(),
      added_by: userId,
      track: id
    };

    playlistTracks.push(playlistTrack); // Push the items in the playlist tracks array
  });

  if (position === undefined)
    playlist.tracks.items = playlist.tracks.items.concat(playlistTracks);
  else {
    const tempArray = playlist.tracks.items.splice(position);
    playlist.tracks.items = playlist.tracks.items.concat(playlistTracks);
    playlist.tracks.items = playlist.tracks.items.concat(tempArray);
  }

  await playlist.save();
};

/**
 * Retrieve a list of a playlists for a certain user
 * @param {String} userId The id of the user to have his playlists retrieved
 * @param {Object} queryParams The query parameters of the request
 * @returns {Array<PlaylistObject>}
 */

const getUserPlaylists = async (userId, queryParams) => {
  if (!queryParams) queryParams = {};

  queryParams.limit = queryParams.limit * 1 || 20;
  queryParams.offset = queryParams.offset * 1 || 0;

  if (queryParams.limit < 0 || queryParams.limit > 50)
    throw new AppError('Limit query parameter out of allowed range', 400);

  if (queryParams.offset < 0 || queryParams.offset > 100000)
    throw new AppError('Offset query parameter out of allowed range', 400);

  const selectFields = [
    'collaborative',
    'external_urls',
    'href',
    'id',
    'images',
    'name',
    'owner',
    'public',
    'type',
    'uri',
    'tracks.href',
    'description'
  ].join(' ');

  let userFollowedPlaylists = await User.findById(userId).select(
    'followedPlaylists'
  );
  if (userFollowedPlaylists) {
    userFollowedPlaylists = userFollowedPlaylists.followedPlaylists
      .toObject()
      .map(el => el.playlist);
  } else userFollowedPlaylists = [];

  const features = new APIFeatures(
    Playlist.find(
      { _id: { $in: userFollowedPlaylists } },
      selectFields
    ).populate([
      {
        path: 'owner',
        select: 'external_urls href id type uri name'
      }
    ]),
    queryParams
  )
    .filter()
    .skip();
  //
  const playlists = await features.query;

  const pagingObject = {
    href: `https://api.spotify.com/v1/users/${userId}/playlists`,
    items: playlists,
    limit: queryParams.limit,
    offset: queryParams.offset
  };

  return pagingObject;
};

/**
 * Change the details of a playlist given its id and the attributes to be changed
 * @param {Object} bodyParams An object containing the details of the new playlist
 * @param {String} playlistId The id of the playlist to be edited
 * @param {String} userId the id of the user issuing the request
 * @return {None}
 */
const changePlaylistDetails = async (bodyParams, playlistId, userId) => {
  const playlistOwner = await Playlist.findById(playlistId);

  if (!playlistOwner) throw new AppError('No playlist found with that id', 404);

  if (String(playlistOwner.owner) !== String(userId)) {
    throw new AppError('You are not authorized to edit this playlist', 403);
  }

  const allowedFields = ['name', 'description', 'collaborative', 'public'];

  bodyParams = filterObj(bodyParams, allowedFields);

  await Playlist.findByIdAndUpdate(playlistId, bodyParams, {
    new: true, // To return the new document after modification
    runValidators: true // To run the validators after updating the document
  });
};

/**
 * Delete tracks from playlist given its id
 * requestTracks can have tracks with ID only or tracks with ID and positions specified
 * @param {String} playlistId The id of the playlist
 * @param {String} userId The id of the user issuing the request
 * @param {Object} requestTracks A list of objects of ids of tracks and their positions(optional)
 * @returns {None}
 */

const deletePlaylistTrack = async (playlistId, userId, requestTracks) => {
  if (!requestTracks || requestTracks.length === 0)
    throw new AppError('Invalid Request Body', 400);

  // Check for bad requests

  requestTracks.forEach(track => {
    Object.keys(track).forEach(el => {
      if (el !== 'id' && el !== 'positions')
        throw new AppError('Invalid Request Body', 400);
    });
  });

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) throw new AppError('No playlist found with that ID', 404);

  if (String(playlist.owner) !== String(userId))
    throw new AppError(
      'You are not authorized to modify this playlist as you are not the owner',
      403
    );

  const { tracks } = playlist;

  if (!tracks || !tracks.items || tracks.items.length === 0)
    throw new AppError('This playlist contains no tracks', 400);

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

  const toBeDeletedIDsWithPos = [];
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

  const toBeDeletedIDsWithoutPos = [];

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

/* istanbul ignore next */
const addPlaylistImage = async (playlistId, requestFile) => {
  const url = `./${requestFile.destination}/${requestFile.filename}`;

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
  userId,
  rangeStart,
  rangeLength,
  insertBefore
) => {
  rangeLength = rangeLength * 1 || 1;

  const playlistOwner = await Playlist.findById(playlistId);

  if (!playlistOwner) throw new AppError('No playlist found with that id', 404);

  if (String(playlistOwner.owner) !== String(userId)) {
    throw new AppError('You are not authorized to edit this playlist', 403);
  }

  if (
    (!rangeStart && rangeStart !== 0) ||
    !rangeLength ||
    (!insertBefore && insertBefore !== 0) ||
    rangeStart < 0 ||
    rangeLength < 0 ||
    insertBefore < 0
  )
    throw new AppError('Please specify all parameters correctly', 400);

  if (insertBefore >= rangeStart && insertBefore < rangeLength + rangeStart) {
    throw new AppError(
      'insertBefore cannot lie between rangeStart and rangeStart + rangeLength',
      400
    );
  }

  let playlistTracksArray = (
    await Playlist.findById(playlistId).select('tracks')
  ).tracks.items;

  const omittedArray = playlistTracksArray.splice(rangeStart, rangeLength);

  if (insertBefore >= rangeStart + rangeLength) insertBefore -= rangeLength;

  const secondHalf = playlistTracksArray.splice(insertBefore);

  playlistTracksArray = playlistTracksArray.concat(omittedArray);
  playlistTracksArray = playlistTracksArray.concat(secondHalf);

  await Playlist.findByIdAndUpdate(playlistId, {
    'tracks.items': playlistTracksArray
  });
};

/**
 * Creates a Playlist
 * @param {String} userId The id of the owner of the playlist
 * @param {Object} requestBody The body of the playlist to be created
 */
const createPlaylist = async (userId, requestBody) => {
  const allowedBodyFields = ['name', 'description', 'public', 'collaborative'];
  if (!requestBody || !requestBody.name)
    throw new AppError('Invalid Request Body or missing name', 400);

  if (requestBody.collaborative === 'true' && requestBody.public !== 'false')
    throw new AppError("A playlist can't be collaborative and public", 400);

  requestBody = filterObj(requestBody, allowedBodyFields);

  requestBody.owner = userId;

  const newPlaylist = await Playlist.create(requestBody);

  followController.followPlaylistLogic(userId, newPlaylist._id, true);

  return newPlaylist;
};

/* istanbul ignore next */
const uploadImage = async (fileData, playlistId, userId) => {
  if (!fileData) throw new AppError('Invalid file uploaded', 400);
  if (!playlistId) throw new AppError('Playlist id not specified', 400);
  if (!userId) throw new AppError('User id not specified', 400);

  const playlist = await authorizeUserToPlaylist(userId, playlistId);

  if (!playlist) throw new AppError('Playlist not found', 404);

  const dimensions = [
    [640, 640],
    [300, 300],
    [60, 60]
  ];

  const qualityNames = ['High', 'Medium', 'Low'];

  const imgObjects = await uploadAWSImage(
    fileData,
    'playlist',
    playlistId,
    dimensions,
    qualityNames
  );

  playlist.images = imgObjects;

  await playlist.save();
};

/* istanbul ignore next */
exports.getPlaylist = catchAsync(async (req, res, next) => {
  const playlist = await getPlaylist(
    req.params.playlist_id,
    req.user._id,
    req.query
  );

  res.status(200).json(playlist);
});

/* istanbul ignore next */
exports.getPlaylistTracks = catchAsync(async (req, res, next) => {
  const tracks = await getPlaylistTracks(
    req.params.playlist_id,
    req.user._id,
    req.query
  );

  res.status(200).json(tracks);
});

/* istanbul ignore next */
exports.getPlaylistImages = catchAsync(async (req, res, next) => {
  const playlistId = req.params.playlist_id;
  const userId = req.user._id;

  const playlist = await authorizeUserToPlaylist(userId, playlistId);

  const { images } = playlist;

  res.status(200).json(images);
});

/* istanbul ignore next */
exports.createPlaylist = catchAsync(async (req, res, next) => {
  const newPlaylist = await createPlaylist(req.user._id, req.body);

  res.status(201).json(newPlaylist);
});

/* istanbul ignore next */
exports.addPlaylistTrack = catchAsync(async (req, res, next) => {
  await addPlaylistTrack(
    req.params.playlist_id,
    req.user._id,
    req.body.ids,
    req.body.position
  );

  res.status(201).send();
});

/* istanbul ignore next */
exports.getUserPlaylists = catchAsync(async (req, res, next) => {
  const playlists = await getUserPlaylists(req.params.user_id, req.query);

  res.status(200).json(playlists);
});

/* istanbul ignore next */
exports.getMyUserPlaylists = catchAsync(async (req, res, next) => {
  const playlists = await getUserPlaylists(req.user._id, req.query);

  res.status(200).json(playlists);
});

/* istanbul ignore next */
exports.changePlaylistDetails = catchAsync(async (req, res, next) => {
  await changePlaylistDetails(req.body, req.params.playlist_id, req.user._id);

  res.status(200).send();
});

/* istanbul ignore next */
exports.deletePlaylistTrack = catchAsync(async (req, res, next) => {
  await deletePlaylistTrack(
    req.params.playlist_id,
    req.user._id,
    req.body.tracks
  );

  res.status(200).send();
});

/* istanbul ignore next */
exports.addPlaylistImage = catchAsync(async (req, res, next) => {
  await addPlaylistImage(req.params.playlist_id, req.file);

  res.status(202).send();
});

/* istanbul ignore next */
exports.reorderPlaylistTracks = catchAsync(async (req, res, next) => {
  await reorderPlaylistTracks(
    req.params.playlist_id,
    req.user._id,
    req.body.range_start,
    req.body.range_length,
    req.body.insert_before
  );

  res.status(200).send();
});

/* istanbul ignore next */
exports.uploadImage = catchAsync(async (req, res, next) => {
  await uploadImage(req.files.image.data, req.params.playlist_id, req.user._id);

  res.status(202).send();
});

exports.getPlaylistLogic = getPlaylist;
exports.getPlaylistTracksLogic = getPlaylistTracks;
exports.addPlaylistTrackLogic = addPlaylistTrack;
exports.getUserPlaylistsLogic = getUserPlaylists;
exports.changePlaylistDetailsLogic = changePlaylistDetails;
exports.deletePlaylistTrackLogic = deletePlaylistTrack;
exports.reorderPlaylistTracksLogic = reorderPlaylistTracks;
exports.validateLimitOffsetLogic = validateLimitOffset;
exports.authorizeUserToPlaylistLogic = authorizeUserToPlaylist;

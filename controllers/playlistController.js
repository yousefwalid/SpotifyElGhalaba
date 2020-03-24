const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const filterDoc = require('./../utils/filterDocument');
const imageObject = require('./../models/objects/imageObject');
const pagingObject = require('./../models/objects/pagingObject');
const parseFields = require('./../utils/parseFields');
const multer = require('multer');
const sharp = require('sharp');
const excludePopulationFields = require('./../utils/excludePopulationFields');

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
 * This class contains all the business logic for the Playlist Controller
 */
class PlaylistController {
  /**
   * Validates the ranges of limit and offset
   * @param {Number} limit The limit parameter, defaults to 100 if not passed
   * @param {Number} offset The offset parameter, defaults to 0 if not passed
   * @param {Object} next The next object for handling errors in express
   */
  validateLimitOffset(limit, offset, next) {
    limit = limit * 1 || 100;
    offset = offset * 1 || 0;

    if (limit <= 0)
      return next(
        new AppError(
          'Limit query parameter can not be less than or equal to 0',
          500
        )
      );

    if (limit > 100)
      return next(
        new AppError('Limit query parameter can not be greater than 100', 500)
      );

    return { limit, offset };
  }

  /**
   * Gets a Playlist given its id
   * @param {String} playlistId The id of the Playlist to be retrieved
   * @param {Object} queryParams The query parameters of the request
   * @param {Object} next The next object for handling errors in express
   * @returns {PlaylistObject}
   * @todo Handle different errors
   */

  async getPlaylist(playlistId, queryParams, next) {
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
      return next(new AppError('No playlist found with that id', 404));
    }

    return playlist;
  }

  /**
   * Gets tracks of a certain playlist given its id
   * @param {String} playlistId The id of the playlist
   * @param {Object} queryParams The query parameters of the request
   * @param {Object} next The next object for handling errors in express
   * @returns {PagingObject}
   * @todo Handle unselecting limit and offset in limitFields
   * @todo Fix fields on population
   */

  async getPlaylistTracks(playlistId, queryParams, next) {
    const { limit, offset } = playlistController.validateLimitOffset(
      queryParams.limit,
      queryParams.offset,
      next
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

    return pagingObject;
  }

  /**
   * Adds a list of tracks into a playlist given its id, can have a position specified to insert the tracks at
   * @param {String} playlistId The id of the playlist
   * @param {Array<String>} uris An array of the Spotify track URIs to add
   * @param {Number} position The position to insert the tracks, a zero-based index
   * @param {String} userId The id of the user issuing the request
   * @param {Object} next The next object for handling errors in express
   * @returns {null}
   */

  async addPlaylistTrack(playlistId, uris, position, userId, next) {
    if (!uris || uris.length == 0) {
      return next(new AppError('No URIs specified', 400));
    }

    if (!userId) {
      return next(new AppError('A user must be passed', 500));
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return next(new AppError('No playlist found with that id', 404));
    }

    if (playlist.owner != userId) {
      return next(new AppError('You are not the owner of this playlist', 403));
    }

    if (playlist.tracks.length + uris.length > 10000) {
      return next(
        new AppError("Playlist size can't exceed 10,000 tracks", 403)
      );
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
  }

  /**
   * Retrieve a list of a playlists for a certain user
   * @param {String} userId The id of the user to have his playlists retrieved
   * @param {Object} queryParams The query parameters of the request
   * @param {Object} next The next object for handling errors in express
   * @returns {Array<PlaylistObject>}
   */

  async getUserPlaylists(userId, queryParams, next) {
    queryParams.limit = queryParams.limit * 1 || 20;
    queryParams.offset = queryParams.offset * 1 || 0;

    if (queryParams.limit <= 0 || query.params.limit > 50)
      return next(
        new AppError('Limit query parameter out of allowed range', 500)
      );

    if (queryParams.offset <= 0 || queryParams.offset > 100000)
      return next(
        new AppError('Offset query parameter out of allowed range', 500)
      );

    const features = new APIFeatures(
      Playlist.find({ owner: userId }),
      queryParams
    )
      .filter()
      .skip();

    const playlists = await features.query;

    return playlists;
  }
}

let playlistController = new PlaylistController();

exports.getPlaylist = catchAsync(async (req, res, next) => {
  const playlist = await playlistController.getPlaylist(
    req.params.playlist_id,
    req.query
  );

  res.status(200).json(playlist);
});

exports.getPlaylistTracks = catchAsync(async (req, res, next) => {
  const tracks = await playlistController.getPlaylistTracks(
    req.params.playlist_id,
    req.query,
    next
  );

  res.status(200).json(tracks);
});

exports.getPlaylistImages = catchAsync(async (req, res, next) => {
  const images = (await Playlist.findById(req.params.playlist_id)).images;

  res.status(200).json(images);
});

exports.createPlaylist = catchAsync(async (req, res, next) => {
  req.body.owner = req.user;
  const newPlaylist = await Playlist.create(req.body);

  res.status(201).json(newPlaylist);
});

exports.addPlaylistTrack = catchAsync(async (req, res, next) => {
  playlistController.addPlaylistTrack(
    req.params.playlist_id,
    req.body.uris,
    req.body.position,
    req.user._id,
    next
  );

  res.status(201).send();
});

exports.getUserPlaylists = catchAsync(async (req, res, next) => {
  const playlists = await playlistController.getUserPlaylists(
    req.params.user_id,
    req.query
  );

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

/**
 * Deletes a track
 */

exports.deletePlaylistTrack = catchAsync(async (req, res, next) => {
  const playlist = await Playlist.findById(req.params.playlist_id);

  if (!playlist)
    return next(new AppError('No playlist found with that ID', 404));

  if (playlistOwner !== req.user)
    return next(
      new AppError(
        'You are not authorized to modify this playlist as you are not the owner',
        403
      )
    );

  const tracks = playlist.tracks;

  if (!tracks)
    return next(new AppError('This playlist contains no tracks'), 404);

  // 1) Verify that request is correct

  const requestTracks = req.body.tracks;

  if (!requestTracks) return next(new AppError('Invalid Request Body', 400));

  // For each track in the request, verify that the position specified actually contains that track
  requestTracks.forEach(track => {
    if (track.positions) {
      positions.forEach(pos => {
        if (tracks[pos].track.uri !== track.uri) {
          return next(
            new AppError('A track does not exist at the specified position'),
            400
          );
        }
      });
    }
  });

  // 2) Delete all tracks with position specified

  var toBeDeletedIDs = [];
  requestTracks.forEach(track => {
    if (track.positions) {
      positions.forEach(pos => {
        toBeDeletedIDs.assert(tracks[pos]._id);
      });
    }
  });

  // Remove all tracks from playlist where tracks._id is $in toBeDeletedIDs
  await Playlist.findByIdAndUpdate(req.params.playlist_id, {
    $pull: { tracks: { 'track._id': { $in: toBeDeletedIDs } } }
  });

  // 3) Delete all tracks with no position specified

  var toBeDeletedIDs2 = [];

  requestTracks.forEach(track => {
    if (!track.positions) {
      toBeDeletedIDs2.assert(track.uri.splice(14));
    }
  });

  // Remove all tracks from playlist where tracks.track.uri is $in toBeDeletedIDs2
  await Playlist.findByIdAndUpdate(req.params.playlist_id, {
    $pull: { tracks: { 'tracks.track._id': { $in: toBeDeletedIDs2 } } }
  });

  res.status(200).send();
});

exports.addPlaylistImage = catchAsync(async (req, res, next) => {
  const url = './' + req.file.destination + '/' + req.file.filename;
  await sharp(url)
    .metadata()
    .then(function(metadata) {
      req.file.width = metadata.width;
      req.file.height = metadata.height;
    });

  const imageObj = {
    url: url,
    width: req.file.width,
    height: req.file.height
  };

  await Playlist.findByIdAndUpdate(req.params.playlist_id, {
    $set: { images: [imageObj] }
  });

  res.status(202).send();
});

exports.reorderPlaylistTracks = catchAsync(async (req, res, next) => {
  const range_start = req.body.range_start;
  const range_length = req.body.range_length * 1 || 1;
  let insert_before = req.body.insert_before;

  if (
    insert_before >= range_start &&
    insert_before < range_length + range_start
  ) {
    return next(
      new AppError(
        'insert_before cannot lie between range_start and range_start + range_length',
        500
      )
    );
  }

  if (
    (!range_start && range_start !== 0) ||
    !range_length ||
    (!insert_before && insert_before !== 0) ||
    range_start < 0 ||
    range_length < 0 ||
    insert_before < 0
  )
    return next(new AppError('Please specify all parameters correctly', 500));

  let playlistTracksArray = (await Playlist.findById(
    req.params.playlist_id
  ).select('tracks')).tracks.items;

  const omittedArray = playlistTracksArray.splice(range_start, range_length);

  if (insert_before >= range_start + range_length)
    insert_before -= range_length;

  const secondHalf = playlistTracksArray.splice(insert_before);

  playlistTracksArray = playlistTracksArray.concat(omittedArray);
  playlistTracksArray = playlistTracksArray.concat(secondHalf);

  await Playlist.findByIdAndUpdate(req.params.playlist_id, {
    'tracks.items': playlistTracksArray
  });

  res.status(200).send();
});

exports.uploadPlaylistImage = upload.single('photo');

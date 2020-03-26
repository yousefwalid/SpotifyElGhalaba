const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const imageObject = require('./../models/objects/imageObject');
const pagingObject = require('./../models/objects/pagingObject');
const parseFields = require('./../utils/parseFields');
const multer = require('multer');
const sharp = require('sharp');

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
 *  Route handler for getting a playlist
 */

exports.getPlaylist = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Playlist.findById(req.params.playlist_id),
    req.query
  )
    .filter()
    .limitFields();

  const playlist = await features.query;

  if (!playlist) {
    return next(new AppError('No playlist found with that id', 404));
  }

  res.status(200).json(playlist);
});

exports.createPlaylist = catchAsync(async (req, res, next) => {
  req.body.owner = req.user;

  const newPlaylist = await Playlist.create(req.body);
  console.log(newPlaylist);

  res.status(201).json(newPlaylist);
});

exports.getPlaylistTracks = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 100;
  const offset = req.query.offset * 1 || 0;

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

  let queryObject = {};

  if (req.query.fields) {
    req.query.fields = req.query.fields.replace('items', 'tracks.items');
    queryObject = parseFields(req.query.fields);
  }

  queryObject['tracks.items'] = { $slice: [offset, limit] };

  const features = new APIFeatures(
    Playlist.findById(req.params.playlist_id, queryObject).select('tracks'),
    req.query
  ).filterOne();

  const tracks = await features.query;

  const pagingObject = {
    href:
      'https://api.spotify.com/v1/' +
      `playlists/${req.params.playlist_id}/tracks`,
    items: tracks.tracks.items,
    limit,
    offset
  };

  res.status(200).json(pagingObject);
});

exports.getPlaylistImages = catchAsync(async (req, res, next) => {
  const images = (await Playlist.findById(req.params.playlist_id)).images;

  res.status(200).json(images);
});

exports.addPlaylistTrack = catchAsync(async (req, res, next) => {
  const playlist = await Playlist.findById(req.params.playlist_id);
  const uris = req.body.uris;
  const position = req.body.position * 1 || undefined;

  if (playlist.tracks.length + uris.length > 10000) {
    return new AppError("Playlist size can't exceed 10,000 tracks", 403);
  }

  uris.forEach(uri => {
    uri = uri.slice(14);

    const playlistTrack = {
      added_at: Date.now(),
      added_by: req.user,
      track: uri
    };

    playlist.tracks.items.push(playlistTrack);
  });

  playlist.save();

  res.status(201).send();
});

exports.getUserPlaylists = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Playlist.find({ owner: req.params.user_id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .skip();

  const playlists = await features.query;

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

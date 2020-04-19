const { ObjectId } = require('mongoose').Types;
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');
const Album = require('./../models/albumModel');
const Playlist = require('./../models/playlistModel');
const PlayHistory = require('./../models/playHistoryModel');
const catchAsync = require('./../utils/catchAsync');
const authenticationController = require('./authenticationController');
const Features = require('./../utils/apiFeatures');
const Track = require('./../models/trackModel');
/*
 
  ######  ######## ########  ##     ## ####  ######  ########  ######  
 ##    ## ##       ##     ## ##     ##  ##  ##    ## ##       ##    ## 
 ##       ##       ##     ## ##     ##  ##  ##       ##       ##       
  ######  ######   ########  ##     ##  ##  ##       ######    ######  
       ## ##       ##   ##    ##   ##   ##  ##       ##             ## 
 ##    ## ##       ##    ##    ## ##    ##  ##    ## ##       ##    ## 
  ######  ######## ##     ##    ###    ####  ######  ########  ######  
 
*/
/**
 * @description Set's a time interval to check and set the user's Online/Offline status.
 * @param {Object} ws WebSocket Object.
 * @param {ObjectId} id User's Id.
 */
//Uses webSocket module [TEST E2E only] - No need for unittesting
/* istanbul ignore next */
const checkOnlineStatus = (ws, id) => {
  //set online status variable.
  ws.isOnline = true;
  //On receiving 'pong', reset online status.
  ws.on('pong', () => {
    ws.isOnline = true;
  });

  const interval = setInterval(async function ping() {
    //If online status is false (The user didn't send a 'pong').
    //Close the connection.
    if (ws.isOnline === false) {
      await User.findByIdAndUpdate(id, { online: false }).lean({
        virtuals: false
      });
      return ws.terminate();
    }
    //clear online status
    ws.isOnline = false;
    //Send ping
    if (ws.readyState === 1) ws.ping(null);
    else {
      return ws.terminate(); //This if else statement to avoid errors of sudden changes in ws.readyState
    }
  }, 30000);
  ws.on('close', async () => {
    clearInterval(interval);
    if (ws.isOnline) {
      await User.findByIdAndUpdate(id, { online: false }).lean({
        virtuals: false
      });
    }
  });
};

/**
 * @description Set's a time interval to check and set the user's streaming status(Streaming or Not).
 * @param {Object} ws WebSocket Object.
 * @param {ObjectId} id User's Id.
 */
//Uses WebSocket module [TEST E2E only] - No need for unittesting
/* istanbul ignore next */
const checkStreamingStatus = (ws, id) => {
  ws.lastTime = 0;
  ws.isPlaying = false;
  const playing = setInterval(async () => {
    if (ws.lastTime < Date.now() - 10000 && ws.isPlaying) {
      ws.isPlaying = false;
      //DB STOPPED PLAYING
      await User.findByIdAndUpdate(id, {
        $set: { 'currentlyPlaying.is_playing': false }
      }).lean({ virtuals: false });
    }
  }, 30000);

  ws.on('message', async msg => {
    if (msg === 'streaming') {
      if (!ws.isPlaying) {
        ws.isPlaying = true;

        await User.findByIdAndUpdate(id, {
          $set: { 'currentlyPlaying.is_playing': true }
        }).lean({ virtuals: false });
      }
      ws.lastTime = Date.now();
    }
  });
  ws.on('close', async () => {
    clearInterval(playing);
    if (ws.isPlaying) {
      await User.findByIdAndUpdate(id, {
        $set: { 'currentlyPlaying.is_playing': false }
      }).lean({ virtuals: false });
    }
  });
};
/**
 * @description Save a user's played track to his history.
 * @param {ObjectId} userId User's Id
 * @param {ObjectId} trackId Track's Id
 * @param {Date} playedAt Timestamp at which the user played a track.
 */
const saveTrackToHistory = async (userId, trackId, playedAt, contextUri) => {
  const contextUriElements = contextUri.split(':');
  const type = contextUriElements[1]; //album / artist / playlist
  const id = contextUriElements[2];
  if (type === 'album' && !(await Album.findById(new ObjectId(id))))
    throw new AppError('Invalid album id');
  else if (type === 'artist' && !(await Artist.findById(new ObjectId(id))))
    throw new AppError('Invalid artist id');
  else if (type === 'playlist' && !(await Playlist.findById(new ObjectId(id))))
    throw new AppError('Invalid album id');
  let href =
    process.env.NODE_ENV === 'production'
      ? process.env.DOMAIN_PRODUCTION
      : process.env.DOMAIN_DEVELOPMENT;
  href += `/${type}s/${id}`;

  const record = await PlayHistory.create({
    track: trackId,
    user: userId,
    played_at: playedAt,
    context: {
      type,
      uri: contextUri,
      href
    }
  });

  if (!record) throw new AppError('The Given Data Is Invalid', 400);
};
exports.saveTrackToHistory = saveTrackToHistory;

/**
 * @description Updates the user's currently playing track in his playback object.
 * @param {ObjectId} userId User's Id
 * @param {ObjectId} trackId Track's Id
 */
const updateUserCurrentPlayingTrack = async (userId, trackId, contextUri) => {
  const contextUriElements = contextUri.split(':');
  const type = contextUriElements[1]; //album / artist / playlist
  const id = contextUriElements[2];
  if (type === 'album' && !(await Album.findById(new ObjectId(id))))
    throw new AppError('Invalid album id');
  else if (type === 'artist' && !(await Artist.findById(new ObjectId(id))))
    throw new AppError('Invalid artist id');
  else if (type === 'playlist' && !(await Playlist.findById(new ObjectId(id))))
    throw new AppError('Invalid album id');
  let href =
    process.env.NODE_ENV === 'production'
      ? process.env.DOMAIN_PRODUCTION
      : process.env.DOMAIN_DEVELOPMENT;
  href += `/${type}s/${id}`;

  await User.findByIdAndUpdate(userId, {
    $set: {
      'currentlyPlaying.timestamp': Date.now(),
      'currentlyPlaying.track': trackId,
      'currentlyPlaying.context': {
        type,
        uri: contextUri,
        href
      }
    }
  }).lean({ virtuals: false });
};
exports.updateUserCurrentPlayingTrack = updateUserCurrentPlayingTrack;

/**
 * @description Gets a group of the user's recently playing tracks before or after a certain timestamp and their context.
 * @param {ObjectId} id User's Id.
 * @param {Number} limit Number of documents to be returned.
 * @param {Number} before Timestamp before which the tracks are chosen.
 * @param {Number} after Timestamp after which the tracks are chosen.
 */
const getRecentlyPlayed = async (id, limit, before, after) => {
  // eslint-disable-next-line no-shadow
  let query;
  if (after) {
    query = PlayHistory.find(
      {
        user: id,
        played_at: { $gt: new Date(Number(after)) }
      },
      '-_id -__v -user'
    );
  } else {
    query = PlayHistory.find(
      {
        user: id,
        played_at: { $lt: new Date(Number(before)) }
      },
      '-_id -__v -user'
    );
  }

  const items = new Features(query, { limit });

  //apply limiting and return items.
  return await items
    .skip()
    .query.populate('track')
    .lean({ virtuals: false });
};
/**
 * Increments played number of track
 * @param {String} trackID -The ID of the played track
 */
const updatePlayedNumberOfTrack = async trackID => {
  const track = await Track.findById(trackID);
  if (!track) throw new AppError('Track not found', 404);
  await Track.findByIdAndUpdate(track._id, { $inc: { played: 1 } });
};
exports.getRecentlyPlayedService = getRecentlyPlayed;

/**
 * @description Gets a group of the user's recently playing tracks before or after a certain timestamp.
 * @param {ObjectId} id User's Id.
 * @param {Number} limit Number of documents to be returned.
 * @param {Number} before Timestamp before which the tracks are chosen.
 * @param {Number} after Timestamp after which the tracks are chosen.
 */
const getRecentlyPlayedContexts = async (id, limit, before, after) => {
  let played_at;
  if (after) {
    played_at = { $gt: new Date(Number(after)) };
  } else {
    played_at = { $lt: new Date(Number(before)) };
  }

  const playContexts = await PlayHistory.aggregate([
    {
      $unwind: '$context'
    },
    {
      $match: {
        user: id,
        played_at
      }
    },
    {
      $group: {
        _id: '$context.uri',
        lastPlayedTime: { $max: '$played_at' },
        track: { $first: '$track' }
      }
    },
    {
      $project: {
        _id: 0,
        uri: '$_id',
        lastPlayedTime: { $toLong: '$lastPlayedTime' },
        lastPlayedTrackUri: {
          $concat: ['spotify:track:', { $toString: '$track' }]
        }
      }
    },
    {
      $limit: Number(limit)
    }
  ]);

  return playContexts;
};

/*
 
  #######  ##     ## ######## ########  ##    ##    ##     ##    ###    ##       #### ########     ###    ######## ####  #######  ##    ## 
 ##     ## ##     ## ##       ##     ##  ##  ##     ##     ##   ## ##   ##        ##  ##     ##   ## ##      ##     ##  ##     ## ###   ## 
 ##     ## ##     ## ##       ##     ##   ####      ##     ##  ##   ##  ##        ##  ##     ##  ##   ##     ##     ##  ##     ## ####  ## 
 ##     ## ##     ## ######   ########     ##       ##     ## ##     ## ##        ##  ##     ## ##     ##    ##     ##  ##     ## ## ## ## 
 ##  ## ## ##     ## ##       ##   ##      ##        ##   ##  ######### ##        ##  ##     ## #########    ##     ##  ##     ## ##  #### 
 ##    ##  ##     ## ##       ##    ##     ##         ## ##   ##     ## ##        ##  ##     ## ##     ##    ##     ##  ##     ## ##   ### 
  ##### ##  #######  ######## ##     ##    ##          ###    ##     ## ######## #### ########  ##     ##    ##    ####  #######  ##    ## 
 
*/

exports.validateSeek = (req, res, next) => {
  if (
    !req.query.position_ms ||
    !/^\d+$/.test(req.query.position_ms) ||
    parseInt(req.query.position_ms, 10) < 0
  )
    return next(new AppError(`Invalid query parameter 'position_ms'`, 400));
  next();
};

exports.validateRepeat = (req, res, next) => {
  if (
    !req.query.state ||
    (req.query.state !== 'true' && req.query.state !== 'false')
  )
    return next(new AppError(`Invalid query parameter 'state'`, 400));
  next();
};

exports.validateVolume = (req, res, next) => {
  if (
    !req.query.volume_percent ||
    !/^\d+$/.test(req.query.volume_percent) ||
    parseInt(req.query.volume_percent, 10) < 0 ||
    parseInt(req.query.volume_percent, 10) > 100
  )
    return next(new AppError(`Invalid query parameter 'volume_percent'`, 400));
  next();
};

exports.validateShuffle = (req, res, next) => {
  if (
    !req.query.state ||
    (req.query.state !== 'true' && req.query.state !== 'false')
  )
    return next(new AppError(`Invalid query parameter 'state'`, 400));
  next();
};

exports.validateGetRecentlyPlayed = (req, res, next) => {
  if (req.query.limit) {
    if (
      !/^\d+$/.test(req.query.limit) ||
      parseInt(req.query.limit, 10) > 50 ||
      parseInt(req.query.limit, 10) < 1
    )
      return next(
        new AppError(
          `The limit param accepts integers only in the range [1,50]`,
          400
        )
      );
  }
  if (req.query.before && req.query.after)
    return next(
      new AppError(`You have to specify either before or after param.`, 400)
    );
  if (req.query.before || req.query.after) {
    const timestamp =
      // eslint-disable-next-line no-nested-ternary
      req.query.before && /^\d+$/.test(req.query.before)
        ? parseInt(req.query.before, 10)
        : req.query.after && /^\d+$/.test(req.query.after)
        ? parseInt(req.query.after, 10)
        : 'InvalidDate';
    const valid = new Date(timestamp).getTime() > 0;
    if (!valid) return next(new AppError(`Invalid timestamp.`, 400));
  }

  next();
};

/*
 
 ########  ########  #######  ##     ## ########  ######  ########    ##     ##    ###    ##    ## ########  ##       ######## ########   ######  
 ##     ## ##       ##     ## ##     ## ##       ##    ##    ##       ##     ##   ## ##   ###   ## ##     ## ##       ##       ##     ## ##    ## 
 ##     ## ##       ##     ## ##     ## ##       ##          ##       ##     ##  ##   ##  ####  ## ##     ## ##       ##       ##     ## ##       
 ########  ######   ##     ## ##     ## ######    ######     ##       ######### ##     ## ## ## ## ##     ## ##       ######   ########   ######  
 ##   ##   ##       ##  ## ## ##     ## ##             ##    ##       ##     ## ######### ##  #### ##     ## ##       ##       ##   ##         ## 
 ##    ##  ##       ##    ##  ##     ## ##       ##    ##    ##       ##     ## ##     ## ##   ### ##     ## ##       ##       ##    ##  ##    ## 
 ##     ## ########  ##### ##  #######  ########  ######     ##       ##     ## ##     ## ##    ## ########  ######## ######## ##     ##  ######  
 
*/
//request handler - No need for unittesting
/* istanbul ignore next */
exports.status = async (ws, req) => {
  //AUTHENTICATE CONNECTION
  try {
    await authenticationController.protectWs(req, ws);
    //ON CONNECION
    console.log(`${req.user.email} Connected [WebSocket]`);
    //SET USER ONLINE STATUS
    await User.findByIdAndUpdate(req.user._id, { online: true });
    //CHECK ONLINE/OFFLINE LOGIC:
    checkOnlineStatus(ws, req.user._id);
    //CHECK IF THE USER IS PLAYING MUSIC OR NOT:
    //------------------------------------------
    checkStreamingStatus(ws, req.user._id);
    //ON CLOSING CONNECTION
    ws.on('close', () => {
      console.log(`${req.user.email} Disconnected  [WebSocket]`);
    });
  } catch (err) {
    console.log('Error Connecting With WebSocket');
    return;
  }
};
//request handler - No need for unittesting
/* istanbul ignore next */
exports.playTrack = catchAsync(async (req, res, next) => {
  if (!req.body.trackId || !req.body.context_uri)
    return next(new AppError('Missing a body parameter.', 404));
  // eslint-disable-next-line camelcase
  const { context_uri } = req.body;
  const playedAt = req.body.played_at ? req.body.played_at : Date.now();
  const userId = new ObjectId(req.user._id);
  const trackId = new ObjectId(req.body.trackId);

  await saveTrackToHistory(userId, trackId, playedAt, context_uri);

  await updateUserCurrentPlayingTrack(userId, trackId, context_uri);

  await updatePlayedNumberOfTrack(trackId);

  res.status(204).json({});
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.getAvailableDevices = catchAsync(async (req, res, next) => {
  const devices = await User.findById(req.user._id, 'devices -_id').lean({
    virtuals: false
  });
  res.status(200).json({
    devices
  });
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.getCurrentPlayback = catchAsync(async (req, res, next) => {
  let currentlyPlaying = await User.findById(
    req.user._id,
    'currentlyPlaying -_id'
  ).populate({
    path: 'currentlyPlaying.track',
    populate: [{ path: 'album' }, { path: 'artists' }]
  });
  currentlyPlaying = currentlyPlaying.toObject({ virtuals: false });
  currentlyPlaying.currentlyPlaying.track.id =
    currentlyPlaying.currentlyPlaying.track._id;
  currentlyPlaying.currentlyPlaying.track._id = undefined;
  res.status(200).json({
    currentlyPlaying: currentlyPlaying.currentlyPlaying
  });
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.getRecentlyPlayed = catchAsync(async (req, res, next) => {
  if (!req.query.before && !req.query.after) {
    req.query.before = Date.now();
  }
  if (!req.query.limit) {
    req.query.limit = 20;
  }

  const items = await getRecentlyPlayed(
    req.user._id,
    req.query.limit,
    req.query.before,
    req.query.after
  );

  res.status(200).json({
    items
  });
});

//request handler - No need for unittesting
/* istanbul ignore next */
exports.getRecentlyPlayedContexts = catchAsync(async (req, res, next) => {
  if (!req.query.before && !req.query.after) {
    req.query.before = Date.now();
  }
  if (!req.query.limit) {
    req.query.limit = 20;
  }

  const playContexts = await getRecentlyPlayedContexts(
    req.user._id,
    req.query.limit,
    req.query.before,
    req.query.after
  );

  res.status(200).json({
    playContexts
  });
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.getCurrentlyPlayingTrack = catchAsync(async (req, res, next) => {
  const currentlyPlayingTrack = await User.findById(
    req.user._id,
    'currentlyPlaying.track currentlyPlaying.context -_id'
  )
    .populate({
      path: 'currentlyPlaying.track'
    })
    .lean({ virtuals: false });

  //Add the context of the track to the currentlyPlayingTrack object.
  currentlyPlayingTrack.currentlyPlaying.track.context =
    currentlyPlayingTrack.currentlyPlaying.context;

  res.status(200).json({
    currentlyPlayingTrack: currentlyPlayingTrack.currentlyPlaying.track
  });
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.pause = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.is_playing': false }
  }).lean({ virtuals: false });
  res.status(204).json({});
});

//request handler - No need for unittesting
/* istanbul ignore next */
exports.play = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.is_playing': true }
  }).lean({ virtuals: false });
  res.status(204).json({});
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.seekToPosition = catchAsync(async (req, res, next) => {
  if (!req.query.position_ms) {
    return next(
      new AppError('You have to specify position_ms in the body of the request')
    );
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.progress_ms': req.query.position_ms }
  }).lean({ virtuals: false });
  res.status(204).json({});
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.setRepeatMode = catchAsync(async (req, res, next) => {
  if (!req.query.state) {
    return next(
      new AppError(
        'You have to specify repeat state in the body of the request'
      )
    );
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.repeat_state': req.query.state }
  }).lean({ virtuals: false });
  res.status(204).json({});
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.setVolume = catchAsync(async (req, res, next) => {
  if (!req.query.volume_percent) {
    return next(
      new AppError(
        'You have to specify volume percentage in the body of the request'
      )
    );
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.volume_percent': req.query.volume_percent }
  }).lean({ virtuals: false });
  res.status(204).json({});
});
//request handler - No need for unittesting
/* istanbul ignore next */
exports.shuffle = catchAsync(async (req, res, next) => {
  if (!req.query.state) {
    return next(
      new AppError(
        'You have to specify shuffle state in the body of the request'
      )
    );
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.shuffle_state': req.query.state }
  }).lean({ virtuals: false });
  res.status(204).json({});
});
//request handler - No need for unittesting
/* istanbul ignore next */
// exports.skipToNext = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });
//request handler - No need for unittesting
/* istanbul ignore next */
// exports.skipToPrevious = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });
//request handler - No need for unittesting
/* istanbul ignore next */
// exports.transferPlayback = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });

// exports.addToPlaybackQueue = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });

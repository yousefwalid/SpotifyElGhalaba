const { query, validationResult } = require('express-validator');
const { ObjectId } = require('mongoose').Types;
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const PlayHistory = require('./../models/playHistoryModel');
const catchAsync = require('./../utils/catchAsync');
const authenticationController = require('./authenticationController');
const Features = require('./../utils//apiFeatures');

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
    ws.ping(null);
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
const saveTrackToHistory = async (userId, trackId, playedAt) => {
  const record = await PlayHistory.create({
    track: trackId,
    user: userId,
    played_at: playedAt
  });

  if (!record) throw new AppError('The Given Data Is Invalid', 400);
};
/**
 * @description Updates the user's currently playing track in his playback object.
 * @param {ObjectId} userId User's Id
 * @param {ObjectId} trackId Track's Id
 */
const updateUserCurrentPlayingTrack = async (userId, trackId) => {
  await User.findByIdAndUpdate(userId, {
    $set: {
      'currentlyPlaying.timestamp': Date.now(),
      'currentlyPlaying.track': trackId
    }
  }).lean({ virtuals: false });
};

/**
 * @description Gets a group of the user's recently playing tracks before or after a certain timestamp.
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
        played_at: { $gt: Date(after) }
      },
      '-_id -__v -user'
    );
  } else {
    query = PlayHistory.find(
      {
        user: id,
        played_at: { $lt: Date(before) }
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

/*
 
  #######  ##     ## ######## ########  ##    ##    ##     ##    ###    ##       #### ########     ###    ######## ####  #######  ##    ## 
 ##     ## ##     ## ##       ##     ##  ##  ##     ##     ##   ## ##   ##        ##  ##     ##   ## ##      ##     ##  ##     ## ###   ## 
 ##     ## ##     ## ##       ##     ##   ####      ##     ##  ##   ##  ##        ##  ##     ##  ##   ##     ##     ##  ##     ## ####  ## 
 ##     ## ##     ## ######   ########     ##       ##     ## ##     ## ##        ##  ##     ## ##     ##    ##     ##  ##     ## ## ## ## 
 ##  ## ## ##     ## ##       ##   ##      ##        ##   ##  ######### ##        ##  ##     ## #########    ##     ##  ##     ## ##  #### 
 ##    ##  ##     ## ##       ##    ##     ##         ## ##   ##     ## ##        ##  ##     ## ##     ##    ##     ##  ##     ## ##   ### 
  ##### ##  #######  ######## ##     ##    ##          ###    ##     ## ######## #### ########  ##     ##    ##    ####  #######  ##    ## 
 
*/
exports.validate = validations => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    console.log(errors.array()[0].msg);
    if (process.env.NODE_ENV === 'development')
      res.status(400).json({ errors: errors.array() });
    else if (process.env.NODE_ENV === 'production') {
      res.status(400).json({ status: 'Fail', error: errors[0].msg });
    }
  };
};

exports.validateSeek = query('position_ms', 'Invalid query parameter').isInt({
  min: 0
});
exports.validateRepeat = query('state', 'Invalid query parameter').isBoolean();
exports.validateVolume = query(
  'volume_percent',
  'Invalid query parameter'
).isInt({
  min: 0,
  max: 100
});
exports.validateShuffle = query('state', 'Invalid query parameter').isBoolean();

/*
 
 ########  ########  #######  ##     ## ########  ######  ########    ##     ##    ###    ##    ## ########  ##       ######## ########   ######  
 ##     ## ##       ##     ## ##     ## ##       ##    ##    ##       ##     ##   ## ##   ###   ## ##     ## ##       ##       ##     ## ##    ## 
 ##     ## ##       ##     ## ##     ## ##       ##          ##       ##     ##  ##   ##  ####  ## ##     ## ##       ##       ##     ## ##       
 ########  ######   ##     ## ##     ## ######    ######     ##       ######### ##     ## ## ## ## ##     ## ##       ######   ########   ######  
 ##   ##   ##       ##  ## ## ##     ## ##             ##    ##       ##     ## ######### ##  #### ##     ## ##       ##       ##   ##         ## 
 ##    ##  ##       ##    ##  ##     ## ##       ##    ##    ##       ##     ## ##     ## ##   ### ##     ## ##       ##       ##    ##  ##    ## 
 ##     ## ########  ##### ##  #######  ########  ######     ##       ##     ## ##     ## ##    ## ########  ######## ######## ##     ##  ######  
 
*/
exports.status = async (ws, req) => {
  //AUTHENTICATE CONNECTION
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
  ws.on('close', async () => {
    console.log(`${req.user.email} Disconnected  [WebSocket]`);
  });
};

exports.playTrack = catchAsync(async (req, res, next) => {
  const playedAt = req.body.played_at ? req.body.played_at : Date.now();
  const userId = new ObjectId(req.user._id);
  const trackId = new ObjectId(req.body.trackId);

  await saveTrackToHistory(userId, trackId, playedAt);

  await updateUserCurrentPlayingTrack(userId, trackId);

  res.status(204).json({});
});

exports.getAvailableDevices = catchAsync(async (req, res, next) => {
  const devices = await User.findById(req.user._id, 'devices -_id').lean({
    virtuals: false
  });
  res.status(200).json({
    devices
  });
});

exports.getCurrentPlayback = catchAsync(async (req, res, next) => {
  const currentlyPlaying = await User.findById(
    req.user._id,
    'currentlyPlaying -_id'
  )
    .populate('currentlyPlaying.track')
    .lean({ virtuals: false });

  res.status(200).json({
    currentlyPlaying
  });
});

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

exports.getCurrentlyPlayingTrack = catchAsync(async (req, res, next) => {
  const currentlyPlayingTrack = await User.findById(
    req.user._id,
    'cuurentlyPlaying.track -_id'
  )
    .populate({
      path: 'currentlyPlaying.track'
    })
    .lean({ virtuals: false });

  res.status(200).json({
    currentlyPlayingTrack: currentlyPlayingTrack.currentlyPlaying.track
  });
});

exports.pause = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.is_playing': false }
  }).lean({ virtuals: false });
  res.status(204).json({});
});

exports.play = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.is_playing': true }
  }).lean({ virtuals: false });
  res.status(204).json({});
});

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

// exports.skipToNext = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });

// exports.skipToPrevious = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });

// exports.transferPlayback = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });

// exports.addToPlaybackQueue = catchAsync(async (req, res, next) => {
//   res.status().json({});
// });
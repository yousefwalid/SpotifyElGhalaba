const { ObjectId } = require('mongoose').Types;
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const PlayHistory = require('./../models/playHistoryModel');
const catchAsync = require('./../utils/catchAsync');
const authenticationController = require('./authenticationController');
const Features = require('./../utils//apiFeatures');
const filterDoc = require('./../utils/filterDocument');

exports.status = async (ws, req) => {
  await authenticationController.protectWs(req, ws);

  //ON CONNECION
  console.log(`${req.user.email} Connected [WebSocket]`);
  await User.findByIdAndUpdate(req.user._id, { active: true });

  //CHECK ONLINE/OFFLINE LOGIC:
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const interval = setInterval(async function ping() {
    if (ws.isAlive === false) {
      await User.findByIdAndUpdate(req.user._id, { active: false });
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping(null);
  }, 30000);

  //-----------------------------------------------------------------

  //CHECK IF THE USER IS PLAYING MUSIC OR NOT:
  let lastTime = 0;
  let isPlaying = false;
  const playing = setInterval(async () => {
    if (lastTime < Date.now() - 10000 && isPlaying) {
      isPlaying = false;
      //DB STOPPED PLAYING
      await User.findByIdAndUpdate(req.user._id, {
        $set: { 'currentlyPlaying.is_playing': false }
      });
    }
  }, 30000);
  ws.on('message', async msg => {
    // console.log(`${msg} from ${req.user.email}`);
    if (msg === 'streaming') {
      if (!isPlaying) {
        isPlaying = true;
        //DB IS PLAYING
        await User.findByIdAndUpdate(req.user._id, {
          $set: { 'currentlyPlaying.is_playing': true }
        });
      }
      lastTime = Date.now();
    }
    // ws.send(`echo: ${msg}?`);
  });

  //ON CLOSING CONNECTION
  ws.on('close', async () => {
    clearInterval(interval);
    clearTimeout(playing);
    console.log(`${req.user.email} Disconnected  [WebSocket]`);
    if (isPlaying) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: { 'currentlyPlaying.is_playing': false }
      });
    }
    if (ws.isAlive) {
      await User.findByIdAndUpdate(req.user._id, { active: false });
    }
  });
};

exports.addTrack = catchAsync(async (req, res, next) => {
  const record = await PlayHistory.create({
    track: new ObjectId(req.body.trackId),
    user: new ObjectId(req.user._id),
    played_at: req.body.played_at ? req.body.played_at : Date.now()
  });

  if (!record) return next(new AppError('The Given Data Is Invalid', 400));

  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      'currentlyPlaying.timestamp': Date.now(),
      'currentlyPlaying.track': req.body.trackId
    }
  });
  res.status(204).json({});
});

exports.getAvailableDevices = catchAsync(async (req, res, next) => {
  let devices = await User.findById(req.user._id, 'devices');
  devices = filterDoc(devices, ['devices']);
  res.status(200).json({
    devices
  });
});

exports.getCurrentPlayback = catchAsync(async (req, res, next) => {
  let currentlyPlaying = await User.findById(req.user._id, 'currentlyPlaying');
  currentlyPlaying = filterDoc(currentlyPlaying, ['currentlyPlaying']);
  res.status(200).json({
    currentlyPlaying
  });
});

exports.getRecentlyPlayed = catchAsync(async (req, res, next) => {
  if (!req.query) {
    req.query = {};
  }
  if (!req.query.before && !req.query.after) {
    req.query.before = Date.now();
  }
  if (!req.query.limit) {
    req.query.limit = 50;
  }

  let query;
  if (req.query.after) {
    query = PlayHistory.find({
      user: req.user._id,
      played_at: { $gt: Date(req.query.after) }
    });
  } else {
    query = PlayHistory.find({
      user: req.user._id,
      played_at: { $lt: Date(req.query.before) }
    });
  }

  let items = new Features(query, req.query);

  //applies limiting
  items = await items.skip().query;

  res.status(200).json({
    items
  });
});

exports.getCurrentlyPlayingTrack = catchAsync(async (req, res, next) => {
  const currentlyPlayingTrack = await User.findById(req.user._id).populate({
    path: 'currentlyPlaying.track',
    select: 'currentlyPlaying.track'
  });
  res.status(200).json({
    currentlyPlayingTrack
  });
});

exports.pause = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.is_playing': false }
  });
  res.status(204).json({});
});

exports.play = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.is_playing': true }
  });
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
  });
  res.status(204).json({});
});

exports.setRepeatMode = catchAsync(async (req, res, next) => {
  if (!req.query.state) {
    return next(
      new AppError('You have to specify state in the body of the request')
    );
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.repeat_state': req.query.state }
  });
  res.status(204).json({});
});

exports.setVolume = catchAsync(async (req, res, next) => {
  if (!req.query.volume_percent) {
    return next(
      new AppError('You have to specify state in the body of the request')
    );
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.volume_percent': req.query.volume_percent }
  });
  res.status(204).json({});
});

exports.shuffle = catchAsync(async (req, res, next) => {
  if (!req.query.state) {
    return next(
      new AppError('You have to specify state in the body of the request')
    );
  }
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'currentlyPlaying.shuffle_state': req.query.state }
  });
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

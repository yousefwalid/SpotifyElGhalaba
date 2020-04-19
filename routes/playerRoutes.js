const express = require('express');

const authenticationController = require('./../controllers/authenticationController');
const playerController = require('./../controllers/playerController');

const router = express.Router();

router.ws('/status', playerController.status);

router.use(authenticationController.protect);

router.get('/', playerController.getCurrentPlayback);
router.post('/track', playerController.playTrack);
router.get('/devices', playerController.getAvailableDevices);
router.get(
  '/recently-played',
  playerController.validateGetRecentlyPlayed,
  playerController.getRecentlyPlayed
);
router.get(
  '/recently-played-contexts',
  playerController.validateGetRecentlyPlayed,
  playerController.getRecentlyPlayedContexts
);
router.get('/currently-playing', playerController.getCurrentlyPlayingTrack);
router.put('/pause', playerController.pause);
router.put('/play', playerController.play);
router.put(
  '/seek',
  playerController.validateSeek,
  playerController.seekToPosition
);
router.put(
  '/repeat',
  playerController.validateRepeat,
  playerController.setRepeatMode
);
router.put(
  '/volume',
  playerController.validateVolume,
  playerController.setVolume
);
router.put(
  '/shuffle',
  playerController.validateShuffle,
  playerController.shuffle
);
// router.post('/next', playerController.skipToNext);
// router.post('/previous', playerController.skipToPrevious);
// router.put('/', playerController.transferPlayback);

module.exports = router;

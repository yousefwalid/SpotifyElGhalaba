const express = require('express');
const audioFeaturesController = require('./../controllers/audioFeaturesController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();
router.use(authenticationController.protect);
router.route('/:id').get(audioFeaturesController.getAudioFeaturesForTrack);
router
  .route('/')
  .get(audioFeaturesController.getAudioFeaturesForSeveralTracks)
  .post(
    authenticationController.restrictTo('artist'),
    audioFeaturesController.addAudioFeaturesForTrack
  );
module.exports = router;

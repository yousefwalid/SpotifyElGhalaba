const express = require('express');
const audioFeaturesController = require('./../controllers/audioFeaturesController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

router
  .route('/:id')
  .get(
    authenticationController.protect,
    audioFeaturesController.getAudioFeaturesForTrack
  );
router
  .route('/')
  .get(
    authenticationController.protect,
    audioFeaturesController.getAudioFeaturesForSeveralTracks
  )
  .post(
    authenticationController.protect,
    audioFeaturesController.addAudioFeaturesForTrack
  );
module.exports = router;

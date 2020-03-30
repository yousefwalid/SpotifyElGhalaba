const express = require('express');
const trackController = require('./../controllers/trackController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

router
  .route('/:id')
  .get(authenticationController.protect, trackController.getTrack)
  .delete(authenticationController.protect, trackController.removeTrack);
router
  .route('/')
  .get(authenticationController.protect, trackController.getSeveralTracks)
  .post(authenticationController.protect, trackController.createTrack);
module.exports = router;

const express = require('express');
const trackController = require('./../controllers/trackController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();
router.use(authenticationController.protect);
router
  .route('/:id')
  .get(trackController.getTrack)
  .delete(trackController.removeTrack);
router
  .route('/')
  .get(trackController.getSeveralTracks)
  .post(
    authenticationController.restrictTo('artist'),
    trackController.createTrack
  );
module.exports = router;

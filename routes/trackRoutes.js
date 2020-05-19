const express = require('express');
const trackController = require('./../controllers/trackController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();
router.use(authenticationController.protect);
router
  .route('/:id')
  .get(trackController.getTrack)
  .delete(authenticationController.restrictTo('artist'),trackController.removeTrack)
  .patch(
    authenticationController.restrictTo('artist'),
    trackController.updateTrack
  );
router
  .route('/')
  .get(trackController.getSeveralTracks)
  .post(
    authenticationController.restrictTo('artist'),
    trackController.createTrack
  );

router.route('/share/:id').get(trackController.shareTrack);

module.exports = router;

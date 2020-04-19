const express = require('express');
const authController = require('./../controllers/authenticationController');
const personalizationController = require('./../controllers/personalizationController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/me/top/')
  .get('/:type', personalizationController.getTopArtistsAndTracks);

module.exports = router;

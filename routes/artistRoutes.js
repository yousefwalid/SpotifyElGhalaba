const express = require('express');
const artistController = require('./../controllers/artistController');
const authController = require('./../controllers/authenticationController');

const router = express.Router();

router.use(authController.protect);

router.route('/').get(artistController.getMultipleArtists);

router.route('/:id').get(artistController.getArtist);

router.route('/:id/albums').get(artistController.getArtistAlbums);

router.route('/:id/top-tracks').get(artistController.getArtistTopTracks);

router
  .route('/:id/related-artists')
  .get(artistController.getArtistRelatedArtists);

module.exports = router;

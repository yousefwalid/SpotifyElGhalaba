const express = require('express');
const artistController = require('./../controllers/artistController');
const authController = require('./../controllers/authenticationController');

const router = express.Router();

router.use(authController.protect);

router.route('/userId/:id').get(artistController.getArtistByUserInfoId);
router.route('/userId/').get(artistController.getMultipleArtistsByUserInfoIds);
router.route('/:id').get(artistController.getArtist);
router.route('/:id/albums').get(artistController.getArtistAlbums);
router.route('/:id/top-tracks').get(artistController.getArtistTopTracks);
router.route('/').get(artistController.getMultipleArtists);

router
  .route('/:id/related-artists')
  .get(artistController.getArtistRelatedArtists);

module.exports = router;

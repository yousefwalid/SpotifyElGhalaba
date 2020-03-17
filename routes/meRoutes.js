const express = require('express');
const authenticationController = require('./../controllers/authenticationController');
const playlistController = require('./../controllers/playlistController');
const libraryController = require('./../controllers/libraryController');
const router = express.Router();

router.use(authenticationController.protect);

router.route('/playlists').get(playlistController.getMyUserPlaylists);
router
  .route('/albums')
  .get(authenticationController.protect, libraryController.getSavedAlbums)
  .put(
    authenticationController.protect,
    libraryController.saveAlbumsForCurrentUser
  );
router
  .route('/tracks')
  .get(authenticationController.protect, libraryController.getSavedTracks)
  .put(
    authenticationController.protect,
    libraryController.saveTracksForCurrentUser
  );
module.exports = router;

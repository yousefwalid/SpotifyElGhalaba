const express = require('express');
const playlistController = require('./../controllers/playlistController');
const authController = require('./../controllers/authenticationController');
const router = express.Router();

/**
 * @todo add authentication and authorization to routes
 */

router.use(authController.protect);

router
  .route('/:playlist_id')
  .get(playlistController.getPlaylist)
  .put(playlistController.changePlaylistDetails);

router
  .route('/:playlist_id/tracks')
  .get(playlistController.getPlaylistTracks)
  .post(playlistController.addPlaylistTrack);

router.route('/:playlist_id/images').get(playlistController.getPlaylistImages);

module.exports = router;

const express = require('express');
const playlistController = require('./../controllers/playlistController');
const authController = require('./../controllers/authenticationController');
const followController = require('./../controllers/followController');

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
  .post(playlistController.addPlaylistTrack)
  .delete(playlistController.deletePlaylistTrack)
  .put(playlistController.reorderPlaylistTracks);

router.route('/:playlist_id/images').get(playlistController.getPlaylistImages);

router.route('/:playlist_id/images').post(
  //playlistController.uploadPlaylistImage,
  playlistController.addPlaylistImage
);

router
  .route('/:playlist_id/followers')
  .put(followController.followPlaylist)
  .delete(followController.unfollowPlaylist);

router
  .route('/:playlist_id/followers/contains')
  .get(followController.checkFollowingPlaylist);

module.exports = router;

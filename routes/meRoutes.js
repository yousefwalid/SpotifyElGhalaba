const express = require('express');
const authenticationController = require('./../controllers/authenticationController');
const playlistController = require('./../controllers/playlistController');
const followController = require('./../controllers/followController');
const libraryController = require('./../controllers/libraryController');

const router = express.Router();

router.use(authenticationController.protect);

// follow routes
router
  .route('/following')
  .get(followController.getFollowedUsers)
  .put(followController.followUser)
  .delete(followController.unfollow);

router.route('/following/contains').get(followController.checkFollowing);

//playlists routes
router.route('/playlists').get(playlistController.getMyUserPlaylists);

//albums routes
router
  .route('/albums')
  .get(libraryController.getSavedAlbums)
  .put(libraryController.saveAlbumsForCurrentUser)
  .delete(libraryController.removeUserSavedAlbum);
router.route('/albums/contains').get(libraryController.checkUserSavedAlbums);

// tracks routes
router
  .route('/tracks')
  .get(libraryController.getSavedTracks)
  .put(libraryController.saveTracksForCurrentUser)
  .delete(libraryController.removeUserSavedTrack);
router.route('/tracks/contains').get(libraryController.checkUserSavedTracks);

module.exports = router;

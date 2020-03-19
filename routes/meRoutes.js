const express = require('express');
const authenticationController = require('./../controllers/authenticationController');
const playlistController = require('./../controllers/playlistController');
const followController = require('./../controllers/followController');
const libraryController = require('./../controllers/libraryController');

const router = express.Router();

router.use(authenticationController.protect);

// follow routes
router.route("/following")
  .get(followController.getFollowedUsers)
  .put(followController.followUser)
  .delete(followController.unfollow);

router.route("/following/contains")
  .get(followController.checkFollowing);


//playlists routes
router.route('/playlists')
  .get(playlistController.getMyUserPlaylists);

//albums routes
router
  .route('/albums')
  .get(authenticationController.protect, libraryController.getSavedAlbums)
  .put(
    authenticationController.protect,
    libraryController.saveAlbumsForCurrentUser
  );

// tracks routes
router
  .route('/tracks')
  .get(authenticationController.protect, libraryController.getSavedTracks)
  .put(
    authenticationController.protect,
    libraryController.saveTracksForCurrentUser
  );

module.exports = router;
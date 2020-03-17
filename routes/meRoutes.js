const express = require('express');
const authenticationController = require('./../controllers/authenticationController');
const playlistController = require('./../controllers/playlistController');
const followController = require('./../controllers/followController')

const router = express.Router();

router.use(authenticationController.protect);

router.route("/following")
    .get(followController.getFollowedUsers)
    .put(followController.followUser)
    .delete(followController.unfollow);

router.route("/following/contains")
    .get(followController.checkFollowing);

router.route('/playlists')
    .get(playlistController.getMyUserPlaylists);

module.exports = router;
const express = require('express');
const authenticationController = require('./../controllers/authenticationController');
const playlistController = require('./../controllers/playlistController');

const router = express.Router();

router.use(authenticationController.protect);

router.route('/playlists').get(playlistController.getUserPlaylists);

module.exports = router;

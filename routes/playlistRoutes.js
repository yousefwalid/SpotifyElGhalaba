const express = require('express');
const playlistController = require('../controllers/playlistController');

const router = express.Router();

/**
 * @todo add authentication and authorization to routes
 */

router.route('/:playlist_id').get(playlistController.getPlaylist);

/**
 * @todo change this route (merge with users)
 */

router.route('/createPlaylist').post(playlistController.createPlaylist);

router.route('/:playlist_id/tracks').get(playlistController.getPlaylistTracks);

module.exports = router;

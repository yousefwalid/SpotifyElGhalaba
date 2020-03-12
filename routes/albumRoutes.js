const express = require('express');
const albumController = require('./../controllers/albumController');

const router = express.Router();

router.route('/:id').get(albumController.getAlbum);
router.route('/:id/tracks').get(albumController.getAlbumTracks);
module.exports = router;

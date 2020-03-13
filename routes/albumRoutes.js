const express = require('express');
const albumController = require('./../controllers/albumController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

router
  .route('/:id')
  .get(authenticationController.protect, albumController.getAlbum);
router
  .route('/:id/tracks')
  .get(authenticationController.protect, albumController.getAlbumTracks);
router
  .route('/')
  .get(authenticationController.protect, albumController.getSeveralAlbums)
  .post(authenticationController.protect, albumController.createAlbum);
module.exports = router;
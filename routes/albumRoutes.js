const express = require('express');
const albumController = require('./../controllers/albumController');
const authenticationController = require('./../controllers/authenticationController');
const fileUpload = require('express-fileupload');

const router = express.Router();
router.use(authenticationController.protect);
router.route('/:id').get(albumController.getAlbum);
router.route('/:id/tracks').get(albumController.getAlbumTracks);
router.route('/:id/images').post(fileUpload(), albumController.uploadImage);
router
  .route('/')
  .get(albumController.getSeveralAlbums)
  .post(
    authenticationController.restrictTo('artist'),
    albumController.createAlbum
  );
module.exports = router;

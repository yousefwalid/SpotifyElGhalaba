const express = require('express');
const fileUpload = require('express-fileupload');
const albumController = require('./../controllers/albumController');
const authenticationController = require('./../controllers/authenticationController');
const statsController = require('./../controllers/statsController');

const router = express.Router();
router.use(authenticationController.protect);

router.route('/likes').get(statsController.getAlbumsLikes);
router.route('/listens').get(statsController.getAlbumsListens);

router
  .route('/:id')
  .get(albumController.getAlbum)
  .delete(
    authenticationController.restrictTo('artist'),
    albumController.removeAlbum
  )
  .patch(
    authenticationController.restrictTo('artist'),
    albumController.updateAlbum
  );
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

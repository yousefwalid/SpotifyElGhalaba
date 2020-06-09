const express = require('express');
const fileUpload = require('express-fileupload');
const categoryController = require('./../controllers/categoryController');
const authController = require('./../controllers/authenticationController');

const router = express.Router();

router
  .route('/:id/add-playlists')
  .post(authController.protect, categoryController.addPlaylistsToCategory);

router
  .route('/')
  .get(categoryController.getAllCategories)
  .post(authController.protect, categoryController.addCategory);

router.route('/:id').get(categoryController.getCategory);
router
  .route('/:id/update-icon')
  .post(authController.protect, fileUpload(), categoryController.updateIcon);

router
  .route('/:category_id/playlists')
  .get(categoryController.getCategoryPlaylists);

module.exports = router;

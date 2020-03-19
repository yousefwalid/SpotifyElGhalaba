const express = require('express');
const categoryController = require('./../controllers/categoryController');
const authController = require("./../controllers/authenticationController");

const router = express.Router();

router
    .route('/')
    .get(categoryController.getAllCategories)
    .post(authController.protect, categoryController.addCategory);

router
    .route('/:id')
    .get(categoryController.getCategory);

router
    .route('/:category_id/playlists')
    .get(categoryController.getCategoryPlaylists);


module.exports = router;
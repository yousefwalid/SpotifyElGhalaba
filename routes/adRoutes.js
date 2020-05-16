const express = require('express');
const fileUpload = require('express-fileupload');
const authenticationController = require('../controllers/authenticationController');
const adsController = require('../controllers/adController');

const router = express.Router();

router.use(authenticationController.protect);

// follow routes
router
  .route('/')
  .get(adsController.getAd)
  .post(fileUpload(), adsController.insertAd);

module.exports = router;

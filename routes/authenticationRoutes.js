const express = require('express');

const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.patch('/resetPassword/:token', authenticationController.resetPassword);
router.patch(
  '/updatePassword',
  authenticationController.protect,
  authenticationController.updatePassword
);

module.exports = router;

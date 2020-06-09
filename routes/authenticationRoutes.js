const express = require('express');
const geoip = require('geoip-lite');
const passport = require('../config/passportSetup');
const AppError = require('./../utils/appError');

const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

//Get the country of the public ip address that sends the request.
//Send error if the country code is not sent in signup.
const getCountryCode = (req, res, next) => {
  const countryObject = geoip.lookup(req.ip);
  if (!countryObject || !countryObject.country)
    return next(new AppError('Sorry... Cannot Read The Country Code'));
  //else
  req.body.country = countryObject.country;
  next();
};

router.post('/signup', getCountryCode, authenticationController.signupApply);
router.patch('/signup-confirm/:token', authenticationController.signupConfirm);
router.post('/login', authenticationController.login);
router.get('/logout', authenticationController.logout);
router.get(
  '/token',
  authenticationController.protect,
  authenticationController.getToken
);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.patch('/resetPassword/:token', authenticationController.resetPassword);
router.patch(
  '/updatePassword',
  authenticationController.protect,
  authenticationController.updatePassword
);

// Third party authentications

router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: [
      'email',
      'user_birthday',
      'user_gender',
      'user_location',
      'user_link',
      'user_photos'
    ]
  })
);

router.get(
  '/facebook/redirect',
  passport.authenticate('facebook', {
    session: false
  }),
  authenticationController.loginWithFacebook
);

router.post(
  '/facebook-token',
  passport.authenticate('facebook-token', {
    session: false
  }),
  authenticationController.login
);
module.exports = router;
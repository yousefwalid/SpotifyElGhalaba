const express = require('express');
const passport = require('./../passportSetup');

const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();





router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.get('/logout', authenticationController.logout);
router.get('/token', authenticationController.protect, authenticationController.getToken);
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


// to login with google
// router.get(
//   '/google',
//   passport.authenticate('google', {
//     scope: ['profile', 'email']
//   })
// );
// //google callback route
// router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
//   // res.send('You have logged in successfully');
// });
module.exports = router;
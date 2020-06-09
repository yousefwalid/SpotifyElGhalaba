const express = require('express');
const fileUpload = require('express-fileupload');

const authenticationController = require('./../controllers/authenticationController');
const playlistController = require('./../controllers/playlistController');
// const userController = require('./../controllers/userController');
const userController = require('./../controllers//userController');
const notificationController = require('./../controllers/notificationController');
const followController = require('./../controllers/followController');

const router = express.Router();

router.get('/:id/followers', followController.getFollowersOfUser);
router.get('/:id/following', followController.getFollowingOfUser);

router
  .route('/')
  .get(authenticationController.protect, userController.getMe)
  .patch(authenticationController.protect, userController.updateMe);

router.get('/me', authenticationController.protect, userController.getMe);

router.patch(
  '/premium',
  authenticationController.protect,
  userController.sendPremiumToken
);
router.post(
  '/premium/:token',
  authenticationController.protect,
  userController.upgradeToPremium
);

// router.patch(
//   '/premium',
//   authenticationController.protect,
//   userController.applyPremium
// );
// router.post('/premium/:token', userController.setPremium);

//This middleware will be applied on all routes that come after it
router.use(authenticationController.protect);

router.route('/update-avatar').post(fileUpload(), userController.updateAvatar);

// Playlists routes
router.route('/:user_id/playlists').get(playlistController.getUserPlaylists);
router.route('/playlists').post(playlistController.createPlaylist);

// Notifications routes
router
  .route('/test-notification')
  .post(notificationController.testNotification);
router.route('/notifications').get(notificationController.getNotifications);
router
  .route('/notification-token')
  .post(notificationController.addNotificationToken);
router
  .route('/notification-token/:token')
  .delete(notificationController.removeNotificationToken);
router
  .route('/notification-toggle')
  .post(notificationController.toggleNotification);

router
  .route('/notification-status')
  .get(notificationController.getNotificationsStatus);

router.get('/:id', authenticationController.protect, userController.getUser);

module.exports = router;
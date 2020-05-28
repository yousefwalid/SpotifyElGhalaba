/**
 * User Controller
 * @module UserController
 */
const crypto = require('crypto');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('./../utils/email');
const uploadAWSImage = require('../utils/uploadAWSImage');
require('./../utils/awsS3Api');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

/**
 * A method that takes the user id and returns the user object {@link User}.
 * It can also take an optional parameter fields to limit the returned fields
 * @param {String} userId - Id of the user to get his info
 * @param {String} [fields] - Limit the returned fields to specific fields ex: "name email" returns name and email only
 * @returns {User}
 */
const getUser = async (userId, fields) => {
  let user;
  if (!fields || !fields.trim()) user = await User.findById(userId);
  else user = await User.findById(userId).select(fields);

  if (!user) throw new AppError('No user found with this id', 404);
  return user;
};
exports.getUserLogic = getUser;

/**
 * A method that takes the user id and the info to be updated
 * @param {String} userId - Id of the user to update his info
 * @param {Object} updatedInfo - Object of the info you want to update
 * @returns {User}
 */
const updateUser = async (userId, updatedInfo) => {
  const filteredData = filterObj(
    updatedInfo,
    'name',
    'gender',
    'birthdate',
    'country',
    'phoneNumber'
  );
  const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
    new: true
  });

  if (!updatedUser) throw new AppError('No user with this id', 404);

  return updatedUser;
};
exports.updateUserLogic = updateUser;

/**
 * Sends to the logged in user a link with a token to upgrade to premium user if he's free user 
 * @param {UserObject} userObj -The logged in user object
 * @TODO Upgrade the link sent according to the front end link
 */
/* istanbul ignore next */
const sendPremiumToken = async (userObj) => {
  const user = await User.findById(userObj.id);
  if (user.product === "premium")
    throw new AppError("You're already a premium user", 400);

  const upgradeToken = await user.createUpgradeToPremiumToken();
  const message = `Applied for permium product at Spotify Elghalaba? Click on the link below:\n${process.env.DOMAIN_PRODUCTION}/premium/${upgradeToken}\n
  If you didn't submit a request, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your premium request token (Valid for 10 mins)',
      message
    });
  } catch (err) {
    user.premiumToken = undefined;
    user.premiumTokenExpireDate = undefined;
    await user.save({
      validateBeforeSave: false
    });
    throw new AppError('There was an error sending the email, Try again later.', 500);
  }
}
/**
 * Takes a token sent to the user applied for the upgrade and upgrades the user if the token didn't expire
 * @param {String} token -The token sent as a request parameter to upgrade to premium
 */
/* istanbul ignore next */
const upgradeToPremium = async (token) => {
  const hashedToken = crypto
    .createHash('SHA256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    premiumToken: hashedToken,
    premiumTokenExpireDate: {
      $gt: Date.now()
    },
    active: true
  });
  if (!user)
    throw new AppError(`Token is invalid or has expired`, 400);
  user.product = "premium";
  await user.save({
    validateBeforeSave: false
  });
  return user;
}



/* istanbul ignore next */
exports.sendPremiumToken = catchAsync(async (req, res) => {
  await sendPremiumToken(req.user)
  res.status(200).json({
    "status": "success",
    "message": "a token is sent to your email!"
  });
});
/* istanbul ignore next */
exports.upgradeToPremium = catchAsync(async (req, res) => {
  const {
    token
  } = req.params;
  const user = await upgradeToPremium(token);
  res.status(200).json({
    "status": "success",
    "message": "Congrats! you are now a premium user."
  });
});
/* istanbul ignore next */
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await getUser(req.user._id);
  res.status(200).json(user);
});

/* istanbul ignore next */
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await getUser(req.params.id, 'name followers images type');
  res.status(200).json(user);
});

/* istanbul ignore next */
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    throw new AppError('This endpoint is not for updating passwords', 400);

  const updatedUser = await updateUser(req.user._id, req.body);

  res.status(200).json(updatedUser);
});

const updateAvatar = async (fileData, userId) => {
  if (!fileData) throw new AppError('Invalid file uploaded', 400);

  const user = await User.findById(userId);

  /*istanbul ignore next*/
  const dimensions = [
    [640, 640],
    [300, 300],
    [60, 60]
  ];
  /*istanbul ignore next*/
  const qualityNames = ['High', 'Medium', 'Low'];
  /*istanbul ignore next*/
  const imgObjects = await uploadAWSImage(
    fileData,
    'user',
    userId,
    dimensions,
    qualityNames
  );

  /*istanbul ignore next*/
  user.image = imgObjects;
  /*istanbul ignore next*/
  await user.save();
};

/* istanbul ignore next */
exports.updateAvatar = catchAsync(async (req, res, next) => {
  await updateAvatar(req.files.image.data, req.user.id);
  res.status(202).json({
    status: 'success',
    message: 'Avatar image updated successfully'
  });
});
/**
 * User Controller
 * @module UserController
 */
const crypto = require('crypto');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('./../utils/email');

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
 *
 * @param {String} token the premium token that was sent to the user's email.
 * @returns {User} the user that is set to premium.
 */
//The same logic is in authentication controller and tested
/* istanbul ignore next */
const setPremium = async token => {
  const hashedToken = crypto
    .createHash('SHA256')
    .update(token)
    .digest('hex');

  const user = await User.findOne(
    {
      premiumToken: hashedToken,
      premiumTokenExpiresAt: {
        $gt: Date.now()
      }
    },
    User.privateUser()
  );

  if (!user) throw new AppError(`Token is invalid or has expired`, 400);

  user.product = 'premium';
  user.premiumToken = undefined;
  user.premiumTokenExpiresAt = undefined;
  await user.save();
  return user;
};

/**
 *
 * @param {User} user the user object.
 *
 */
//The same logic is in authentication controller and tested
/* istanbul ignore next */
const sendPremiumToken = async user => {
  user = await User.findById(user._id);
  const premiumToken = await user.createPremiumToken();
  try {
    const message = `Applied for permium product at Spotify Elghalaba? Click on the link below:\n${process.env.DOMAIN_PRODUCTION}/premium/${premiumToken}\n
    If you didn't submit a request, please ignore this email.`;
    await sendEmail({
      email: user.email,
      subject: 'Your premium request token (Valid for 10 mins)',
      message
    });
  } catch (err) {
    user.premiumToken = undefined;
    user.premiumTokenExpiresAt = undefined;
    await user.save({
      validateBeforeSave: false
    });
    throw new AppError(
      `There was an error sending the email. Try again later.`,
      500
    );
  }

  if (!user) {
    throw new AppError(`There is no user with this email`, 404);
  }
};

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
// /* istanbul ignore next */
// exports.applyPremium = catchAsync(async (req, res, next) => {
//   await sendPremiumToken(req.user);
//   res
//     .status(200)
//     .json({ status: 'success', message: 'a token is sent to your email!' });
// });
// /* istanbul ignore next */
// exports.setPremium = catchAsync(async (req, res, next) => {
//   const user = await setPremium(req.params.token);

//   res.status(200).json({
//     status: 'success',
//     message: 'Congrats! you are now a premium user.'
//   });
// });

/**
 * User Controller
 * @module UserController
 */

const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

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
    const filteredData = filterObj(updatedInfo, 'name', 'gender', 'birthdate', 'country', 'phoneNumber');
    const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
        new: true
    });

    if (!updatedUser) throw new AppError('No user with this id', 404);

    return updatedUser;
};
exports.updateUserLogic = updateUser;

exports.getMe = catchAsync(async (req, res, next) => {
    const user = await getUser(req.user._id);
    res.status(200).json(user);
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await getUser(req.params.id, 'name followers images type');
    res.status(200).json(user);
});

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm)
        throw new AppError('This endpoint is not for updating passwords', 400);

    const updatedUser = await updateUser(req.user._id, req.body);

    res.status(200).json(updatedUser);
});
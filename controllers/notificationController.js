const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');

const sendNotification = require('../utils/sendNotification');

/**
 * a method that takes userId and notification token to be saved for this userId
 * @param {String} userId - Id of the user to add notification token
 * @param {String} token - The notification token
 * @returns {void}
 */
const addNotificationToken = async (userId, token) => {
    const user = await User.findById(userId);

    if (user.notificationTokens.includes(token))
        throw new AppError("This token already exists", 400);

    user.notificationTokens.push(token);
    await user.save();
};


/**
 * a method that takes userId and notification token to be removed
 * @param {String} userId - Id of the user to remove notification token
 * @param {String} token - The notification token
 * @returns {void}
 */
const removeNotificationToken = async (userId, token) => {
    const user = await User.findById(userId);
    if (!user.notificationTokens.includes(token)) throw new AppError("This token doesn't belong to this user", 400);
    user.notificationTokens = user.notificationTokens.filter(val => val !== token);
    await user.save();
};

/**
 * a method that take userId and page to return his notifcations in and Object
 * @param {String} userId - Id of the user to get his notifications
 * @param {String} page - The page of the notifications each page is 10 notifications
 * @returns {Object}
 */
const getNotifications = async (userId, page) => {
    if (page) page = parseInt(page, 10);
    else page = 1;

    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;

    const {
        notifications
    } = await User.findById(userId).select("notifications");

    const lastNotifications = [...notifications].splice(startIndex, endIndex);

    const response = {
        page,
        count: lastNotifications.length,
        total: notifications.length,
        notifications: lastNotifications
    }

    return response;
};

exports.addNotificationToken = catchAsync(async (req, res, next) => {
    await addNotificationToken(req.user.id, req.body.token);
    res.status(201).json("Token added successfully");
});

exports.removeNotificationToken = catchAsync(async (req, res, next) => {
    await removeNotificationToken(req.user.id, req.params.token);
    res.status(200).json("Token removed successfully");
});


exports.getNotifications = catchAsync(async (req, res, next) => {
    const response = await getNotifications(req.user.id, req.query.page);
    res.status(200).json(response);
});

exports.testNotification = catchAsync(async (req, res, next) => {
    await sendNotification(req.user.id, req.body.title, req.body.body);
    res.status(201).json('done');
});
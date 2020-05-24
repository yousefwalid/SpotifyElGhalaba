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
        throw new AppError("This token already exists", 401);

    user.notificationTokens.push(token);
    await user.save();
};

exports.addNotificationToken = catchAsync(async (req, res, next) => {

    const {
        token
    } = req.body;


    await addNotificationToken(req.user.id, token);

    res.status(201).json("Token added successfully");
});


exports.getNotifications = catchAsync(async (req, res, next) => {
    let page;
    if (req.query.page && req.query.page > 0) page = parseInt(req.query.page, 10);
    else page = 1;

    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;

    const {
        notifications
    } = await User.findById(req.user.id).select("notifications");

    const lastNotifications = [...notifications].splice(startIndex, endIndex);

    const response = {
        page,
        count: lastNotifications.length,
        total: notifications.length,
        notifications: lastNotifications
    }

    res.status(200).json(response);
});

exports.testNotification = catchAsync(async (req, res, next) => {
    await sendNotification(req.user.id, req.body.title, req.body.body);
    res.status(201).json('done');
});
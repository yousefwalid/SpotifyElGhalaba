const admin = require('../config/firebase');
const User = require('../models/userModel');


const sendNotification = async (userId, title, message, data = {}) => {

    const {
        notificationTokens
    } = await User.findById(userId);

    const notification = {
        data,
        notification: {
            title,
            body: message
        },
        tokens: notificationTokens,
        webpush: {
            notification: {
                body: message,
                requireInteraction: "true",
                icon: 'https://i.ibb.co/56ZQYbv/logo.png'
            }
        }
    };

    await admin.messaging().sendMulticast(notification);
}

module.exports = sendNotification;
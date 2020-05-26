const admin = require('../config/firebase');
const User = require('../models/userModel');


const sendNotification = async (userId, title, message, data = {}) => {
    title = String(title);
    const user = await User.findById(userId);
    const tokens = user.notificationTokens.filter(Boolean);

    const notification = {
        data,
        notification: {
            title,
            body: message
        },
        tokens,
        webpush: {
            notification: {
                body: message,
                requireInteraction: "true",
                icon: 'https://i.ibb.co/56ZQYbv/logo.png'
            }
        }
    };

    // send the notification to the clients
    await admin.messaging().sendMulticast(notification);

    // update the notifications array in the db
    const notificationInfo = {
        title,
        body: message,
        data,
        timestamp: new Date()
    }

    user.notifications.unshift(notificationInfo);

    await user.save();
}

module.exports = sendNotification;
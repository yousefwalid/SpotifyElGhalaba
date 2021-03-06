const admin = require('../config/firebase');
const User = require('../models/userModel');


const sendNotification = async (userIds, title, message, data = {}) => {
    title = String(title);

    if (typeof userId === 'string') {
        userIds = [userIds];
    }

    const users = await User.find({
        "_id": {
            "$in": userIds
        }
    });

    let tokens = [];
    users.forEach(user => {
        tokens = tokens.concat(user.notificationTokens);
    });

    // filter all the falsy values
    tokens = tokens.filter(Boolean);

    if (tokens.length === 0) return;

    if (!data.link) {
        let link;
        if (process.env.NODE_ENV === 'development') link = `${process.env.DOMAIN_DEVELOPMENT}:${process.env.FRONTEND_PORT}/`;
        else link = process.env.DOMAIN_PRODUCTION;
        data = {
            link
        }
    }

    const notification = {
        data,
        notification: {
            title,
            body: message
        },
        tokens,
        webpush: {
            fcm_options: {
                link: data.link
            },
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

    await User.updateMany({
        "_id": {
            "$in": userIds
        }
    }, {
        $push: {
            notifications: {
                $each: [notificationInfo],
                $position: 0
            }
        }
    });

}

module.exports = sendNotification;
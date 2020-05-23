const admin = require("firebase-admin");
const serviceAccount = require("../firebaseAdminSDK.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sp8-notifications.firebaseio.com"
});

module.exports = admin;
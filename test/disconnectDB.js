const mongoose = require('mongoose');


const disconnectDB = async () => {
    await mongoose.disconnect();
    console.log("❌ database disconnected");
};

module.exports = disconnectDB;
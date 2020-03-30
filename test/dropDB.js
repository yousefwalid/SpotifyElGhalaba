const mongoose = require('mongoose');

module.exports = async () => {
    Object.keys(mongoose.connection.collections).forEach(async (collection) => {
        await mongoose.connection.collections[collection].drop();
    });
};
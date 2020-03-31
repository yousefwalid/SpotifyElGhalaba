const mongoose = require('mongoose');

module.exports = async (collectionName) => {
  if (collectionName) {
    await mongoose.connection.collections[collectionName].drop();
    console.log(`✅ ${collectionName} dropped successfully`);
  } else {
    Object.keys(mongoose.connection.collections).forEach(async (collection) => {
      await mongoose.connection.collections[collection].drop();
    });

    console.log(`✅ database dropped successfully`);
  }
};
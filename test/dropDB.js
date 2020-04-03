const mongoose = require('mongoose');

const dropDB = async collectionName => {
  if (collectionName) {
    await mongoose.connection.collections[collectionName].drop();
    console.log(`✅ ${collectionName} dropped successfully`);
  } else {
    const collections = await mongoose.connection.db.collections();

    collections.forEach(async collection => {
      await collection.drop();
    });
    console.log(`✅ database dropped successfully`);
  }
};
module.exports = dropDB;

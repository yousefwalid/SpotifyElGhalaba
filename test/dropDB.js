const mongoose = require('mongoose');
const dropDB = async collectionName => {
  if (collectionName) {
    try {
      try {
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`✅ ${collectionName} collection dropped successfully.`);
      } catch (err) {
        console.log(`✅ ${collectionName} collection was already empty.`);
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    const collections = await mongoose.connection.db.collections();

    collections.forEach(async collection => {
      await collection.drop();
    });
    console.log(`✅ database dropped successfully`);
  }
};
module.exports = dropDB;

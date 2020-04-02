const mongoose = require('mongoose');

module.exports = async (collectionName) => {
  if (collectionName) {
    await mongoose.connection.collections[collectionName].drop();
    console.log(`✅ ${collectionName} dropped successfully`);
  } else {
    const collections = await mongoose.connection.db.collections();

    try {
      collections.forEach(async (collection) => {
        await collection.deleteOne();
      });

      console.log(`✅ database dropped successfully`);
    } catch (err) {
      console.log(`❌ Error during dropping database`);
    }


  }
};
/* istanbul ignore file */
const mongoose = require('mongoose');

const dropDB = async function(collectionName) {
  if (collectionName) {
    try {
      await mongoose.connection.db.dropCollection(collectionName);
      console.log(`✅ ${collectionName} collection dropped successfully.`);
    } catch (err) {
      console.log(`✅ ${collectionName} collection was already empty.`);
    }
  } else {
    try {
      const db = await mongoose.connection.db;

      let collections;
      if (db) {
        collections = await db.collections();

        if (collections.length !== 0) {
          // for (let i = 0; i < collections.length; i += 1) {
          //   const collection = collections[i];
          //   // eslint-disable-next-line no-await-in-loop
          //   await collection.drop();
          //   // // eslint-disable-next-line no-await-in-loop
          //   // await collection.deleteMany({});
          //   // // eslint-disable-next-line no-await-in-loop
          //   // await collection.dropIndexes();
          // }
          await db.dropDatabase();
          console.log(`✅ database dropped successfully`);
        } else {
          console.log(`✅ database was already empty.`);
        }
      } else {
        console.log(`❌ Could NOT drop the DB due to Connection Error.`);
        process.exit(1);
      }
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  }
};

// (async function() {
//   await connectDB();
//   await dropDB('users');
//   await disconnectDB();
//   process.exit(0);
// })();

exports.dropDB = dropDB;

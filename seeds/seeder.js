const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userSeed = require('./data/users');
const artistSeed = require('./data/artists');
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');

dotenv.config({
  path: './.test.env'
});

console.log(process.env.DATABASE_LOCAL);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const localTestDB = process.env.DATABASE_TEST;

const connectDB = async () => {
  try {
    await mongoose.connect(localTestDB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    console.log('✅ database connected');
  } catch (err) {
    console.log('❌ database not connected');
    process.exit(1);
  }
};

const dropDB = async collectionName => {
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
          collections.forEach(async collection => {
            await collection.deleteMany({});
          });
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

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ database disconnected');
  } catch (err) {
    console.log('❌ Fail during disconnecting database');
  }
};

(async function() {
  await connectDB();
  await dropDB();

  const { userObjects, artistInfoObjects, adminObjects } = userSeed();

  const users = await User.insertMany(userObjects);
  const artistsInfo = await User.insertMany(artistInfoObjects);
  const admins = await User.insertMany(adminObjects);

  const userIds = artistsInfo.map(el => el._id);

  const artistObjects = artistSeed(userIds);

  const artists = await Artist.insertMany(artistObjects);

  await disconnectDB();
})();

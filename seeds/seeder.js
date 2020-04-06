const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ObjectId } = require('mongoose').Types;
const faker = require('faker');

const randomizeNumber = require('./utils/randomizeNumber');
const userSeed = require('./data/users');
const artistSeed = require('./data/artists');
const albumSeed = require('./data/albums');
const trackSeed = require('./data/tracks');

const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');
const Album = require('./../models/albumModel');
const Track = require('./../models/trackModel');
const PlayHistory = require('./../models/playHistoryModel');

dotenv.config({
  path: './.test.env'
});

console.log(process.env.DATABASE_LOCAL);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const localTestDB = process.env.DATABASE_LOCAL;

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

const createTracks = async albums => {
  const trackObjects = trackSeed.trackObjects();
  const tracks = [];
  let trackIndex = 0;
  for (let j = 0; j < albums.length; j += 1) {
    const album = albums[j];
    const trackCount = randomizeNumber(1, 2);

    for (let i = 0; i < trackCount; i += 1) {
      const newTrack = {
        ...trackObjects[trackIndex],
        album: new ObjectId(album._id),
        artists: album.artists.map(el => new ObjectId(el))
      };

      // eslint-disable-next-line no-await-in-loop
      const track = await Track.create(newTrack);
      tracks.push(track);
      trackIndex += 1;
    }
  }

  return tracks;
};

const createPlayHistories = async (userIds, trackIds) => {
  const playHistories = [];

  for (let i = 0; i < userIds.length; i += 1) {
    const tracksCount = randomizeNumber(3, 6);
    const tracksIndexes = randomizeNumber(
      0,
      trackIds.length - 1,
      tracksCount,
      true
    );
    for (let j = 0; j < tracksIndexes.length; j += 1) {
      // eslint-disable-next-line camelcase
      const played_at = faker.date.past(3);
      // eslint-disable-next-line no-await-in-loop
      const playHistory = await PlayHistory.create({
        user: new ObjectId(userIds[i]),
        track: new ObjectId(trackIds[j]),
        played_at: played_at
      });
      playHistories.push(playHistory);
    }
  }
  return playHistories;
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

  const artistIds = artists.map(el => el._id);

  const albumObjects = albumSeed.albumObjects(artistIds);
  let albums = await Album.insertMany(albumObjects);

  const tracks = await createTracks(albums);

  const trackIds = tracks.map(el => el._id);

  albums = await Album.find({});

  const playHistories = await createPlayHistories(userIds, trackIds);
  await disconnectDB();
})();

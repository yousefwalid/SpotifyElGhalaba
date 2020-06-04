/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ObjectId } = require('mongoose').Types;
const faker = require('faker');

const randomizeNumber = require('./utils/randomizeNumber');
const userSeed = require('./data/users');
const artistSeed = require('./data/artists');
const albumSeed = require('./data/albums');
const trackSeed = require('./data/tracks');
const playlistSeed = require('./data/playlist');
const categorySeed = require('./data/categories');
const adSeed = require('./data/ads');

const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');
const Album = require('./../models/albumModel');
const Track = require('./../models/trackModel');
const PlayHistory = require('./../models/playHistoryModel');
const Playlist = require('./../models/playlistModel');
const Category = require('./../models/categoryModel');

const connectDB = require('./../utils/connectDB');
const disconnectDB = require('./../utils/disconnectDB');
const { dropDB } = require('./../utils/dropDB');

const createPlayHistories = async (userIds, trackIds) => {
  const playHistories = [];

  for (let i = 0; i < userIds.length; i += 1) {
    const tracksCount = randomizeNumber(
      1,
      trackIds.length > 3 ? 3 : trackIds.length
    );
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
  process.env.NODE_ENV = 'seed';
  await connectDB();
  await dropDB();

  console.log('Running seeds, please wait...');

  const { userObjects, artistInfoObjects, adminObjects } = userSeed();

  const users = await User.create(userObjects);
  const artistsInfo = await User.create(artistInfoObjects);
  // const admins = await User.create(adminObjects);

  const usersIds = artistsInfo.map(el => el._id);

  const artistObjects = artistSeed(usersIds);
  const artists = await Artist.create(artistObjects);
  const artistsIds = artists.map(el => el._id);

  const albumObjects = albumSeed.albumObjects(artistsIds);

  let albums = await Album.create(albumObjects);

  const tracks = await trackSeed.createTracks(albums);
  const tracksIds = tracks.map(el => el._id);

  albums = await Album.find({});

  const playHistories = await createPlayHistories(usersIds, tracksIds);

  const playlistObjects = playlistSeed(usersIds, tracksIds);
  const playlists = await Playlist.create(playlistObjects);
  const playlistsIds = playlists.map(el => el._id);

  const categoryObjects = categorySeed.categoryObjects(playlistsIds);
  const categories = await Category.insertMany(categoryObjects);

  await adSeed.createAds();

  await disconnectDB();

  console.log('✅ Seeds executed successfully');
})();

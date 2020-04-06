const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userSeed = require('./data/users');
const artistSeed = require('./data/artists');
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');
const connectDB = require('./../utils/connectDB');
const disconnectDB = require('./../utils/disconnectDB');
const { dropDB } = require('./../utils/dropDB');

(async function() {
  process.env.NODE_ENV = 'testing';
  console.log(process.env.NODE_ENV);
  await connectDB();
  await dropDB();

  // const { userObjects, artistInfoObjects, adminObjects } = userSeed();

  // const users = await User.insertMany(userObjects);
  // const artistsInfo = await User.insertMany(artistInfoObjects);
  // const admins = await User.insertMany(adminObjects);

  // const userIds = artistsInfo.map(el => el._id);

  // const artistObjects = artistSeed(userIds);

  // const artists = await Artist.insertMany(artistObjects);

  await disconnectDB();
})();

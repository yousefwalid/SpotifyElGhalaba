const assert = require('assert');
const connectDB = require('./connectDB');
const disconnectDB = require('./disconnectDB');
const dropDB = require('./dropDB');
const createUser = require('./utils/createUser');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');
const User = require('../models/userModel');
const Album = require('../models/albumModel');
const trackController = require('./../controllers/trackController');

describe('Testing track controller', function () {
  this.timeout(10000);
  let track;
  let user;
  let album;
  let createdTrack;
  this.beforeAll(async () => {
    await connectDB();

    await dropDB();

    user = await User.create(createUser('artist'));
    album = await Album.create(generateAlbum([user._id]));
    track = generateTrack(album._id, [user._id]);
  });

  it('testing creating a track', async function () {
    await assert.doesNotReject(async () => {
      createdTrack = await trackController.createTrackLogic(track, user);
    });
  });

  it('testing getting a track', async function () {
    const returnedTrack = await trackController.getTrackLogic(createdTrack._id);
    Object.keys(track).forEach(key => {
      if (key === 'artists') {
        assert.deepStrictEqual(
          [track.artists],
          Array.from(returnedTrack.artists)
        );
      } else assert.deepStrictEqual(track[key], returnedTrack[key]);
    });
  });

  this.afterAll(async () => {
    await disconnectDB();
  });
});
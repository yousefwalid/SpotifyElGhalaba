const assert = require('assert');

const {
  dropDB
} = require('./dropDB');
const generateArtist = require('./utils/insertArtistIntoDB');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const Album = require('../models/albumModel');
const trackController = require('./../controllers/trackController');

describe('Testing track controller', function () {
  this.timeout(10000);
  const track = [];
  let user;
  let album;
  let createdTrack;

  this.beforeEach(async function () {
    await dropDB();
    user = await generateArtist();
    album = await Album.create(generateAlbum([user._id]));
    for (let i = 0; i < 30; i += 1)
      track[i] = generateTrack(album._id, [user._id]);
  });
  it('testing creating a track', async function () {
    await assert.doesNotReject(async () => {
      createdTrack = await trackController.createTrackLogic(
        track[0],
        user.userInfo._id
      );
    });
  });

  it('testing getting a track', async function () {
    createdTrack = await Track.create(track[0]);
    let returnedTrack = await trackController.getTrackLogic(createdTrack._id);
    returnedTrack = returnedTrack.toObject();
    createdTrack = createdTrack.toObject();
    assert.deepStrictEqual(returnedTrack, createdTrack);
  });
  it('testing getting a track with invalid ID', async function () {
    try {
      await trackController.getTrackLogic('5e8281b93f83d84d5ab32e51');
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('testing removing a track', async function () {
    createdTrack = await Track.create(track[0]);
    await assert.doesNotReject(async () => {
      await trackController.removeTrackLogic(createdTrack._id);
    });
  });
  it('testing getting several tracks', async function () {
    const trackIDs = [];
    const createdTracks = await Track.create(track);
    for (let i = 0; i < 30; i += 1) {
      trackIDs[i] = createdTracks[i].id;
    }
    const returnedTracks = await trackController.getSeveralTracksLogic(
      trackIDs
    );
    for (let i = 0; i < 20; i += 1) {
      Object.keys(returnedTracks).forEach(key => {
        assert.deepStrictEqual(returnedTracks[i][key], createdTracks[i][key]);
      });
    }
    assert.strictEqual(returnedTracks.length, 20);
  });
  it('testing getting several tracks with invalid IDs', async function () {
    const returnedTracks = await trackController.getSeveralTracksLogic([
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51'
    ]);
    for (let i = 1; i < returnedTracks.length; i += 1)
      assert.strictEqual(returnedTracks[i], null);
  });
});
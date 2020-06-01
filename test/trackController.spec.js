const assert = require('assert');

const { dropDB } = require('./../utils/dropDB');
const generateArtist = require('./utils/insertArtistIntoDB');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const Album = require('../models/albumModel');
const trackController = require('./../controllers/trackController');

describe('Testing track controller', function() {
  this.timeout(10000);
  const track = [];
  let user;
  let album;
  let createdTrack;

  this.beforeAll('Track', async function() {
    await dropDB();
  });
  this.beforeEach(async function() {
    user = await generateArtist();
    album = await Album.create(generateAlbum([user._id]));
    for (let i = 0; i < 30; i += 1)
      track[i] = generateTrack(album._id, [user._id]);
  });
  it('testing creating a track', async function() {
    await assert.doesNotReject(async () => {
      createdTrack = await trackController.createTrackLogic(
        track[0],
        user.userInfo._id
      );
    });

    try {
      await trackController.createTrackLogic(track[0], user.userInfo._id);
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
    try {
      await trackController.createTrackLogic(
        track[1],
        '5e8281b93f83d84d5ab32e51'
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
    try {
      track[1].album = '5e8281b93f83d84d5ab32e51';
      await trackController.createTrackLogic(track[1], user.userInfo._id);
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });

  it('testing getting a track', async function() {
    createdTrack = await Track.create(track[0]);
    let returnedTrack = await trackController.getTrackLogic(createdTrack._id);
    returnedTrack = returnedTrack.toObject();
    createdTrack = createdTrack.toObject();
    assert.deepStrictEqual(returnedTrack, createdTrack);
  });
  it('testing getting a track with invalid ID', async function() {
    try {
      await trackController.getTrackLogic('5e8281b93f83d84d5ab32e51');
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('testing getting several tracks', async function() {
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
  it('testing getting several tracks with invalid IDs', async function() {
    const returnedTracks = await trackController.getSeveralTracksLogic([
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51'
    ]);
    for (let i = 1; i < returnedTracks.length; i += 1)
      assert.strictEqual(returnedTracks[i], null);
  });
  it('testing updating a track with invalid ID', async function() {
    try {
      await trackController.updateTrackLogic(
        '5e8281b93f83d84d5ab32e51',
        { name: 'numb' },
        '5e8281b93f83d84d5ab32e51'
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('testing updating a track with other artist ID', async function() {
    const dummyTrack = generateTrack(album._id, user._id);
    const dbTrack = await Track.create(dummyTrack);
    const createdArtist = await generateArtist();
    try {
      await trackController.updateTrackLogic(
        dbTrack._id,
        { name: 'numb' },
        createdArtist.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
    }
  });
  it('testing updating a track', async function() {
    const dummyTrack = generateTrack(album._id, user._id);
    const dbTrack = await Track.create(dummyTrack);
    const updated = await trackController.updateTrackLogic(
      dbTrack._id,
      { name: 'numb' },
      user.userInfo._id
    );
    assert.strictEqual(updated.name, 'numb');
  });
  it('testing updating a track with invalid album update', async function() {
    const dummyTrack = generateTrack(album._id, user._id);
    const dbTrack = await Track.create(dummyTrack);
    try {
      await trackController.updateTrackLogic(
        dbTrack._id,
        { album: '5e8281b93f83d84d5ab32e51' },
        user.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('testing updating a track with album update and invalid artist', async function() {
    const dummyTrack = generateTrack(album._id, user._id);
    const dbTrack = await Track.create(dummyTrack);
    const createdArtist = await generateArtist();
    const dummyAlbum = await Album.create(generateAlbum(createdArtist._id));

    try {
      await trackController.updateTrackLogic(
        dbTrack._id,
        { album: dummyAlbum._id },
        user.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
    }
  });
  it('testing updating a track with album update', async function() {
    const dummyTrack = generateTrack(album._id, user._id);
    const dbTrack = await Track.create(dummyTrack);
    const dummyAlbum = await Album.create(generateAlbum(user._id));
    const updated = await trackController.updateTrackLogic(
      dbTrack._id,
      { album: dummyAlbum._id },
      user.userInfo._id
    );
    assert.deepStrictEqual(updated.album, dummyAlbum._id);
  });
  it('testing removing a track', async function() {
    let randomTrack = generateTrack(album._id, user._id);
    const dummyTrack = await Track.create(randomTrack);
    await trackController.removeTrackLogic(dummyTrack._id, user.userInfo._id);
    const returnedTrack = await Track.findById(dummyTrack._id);
    assert.strictEqual(returnedTrack, null);
  });
  it('testing removing a track with wrong ID', async function() {
    try {
      await trackController.removeTrackLogic(
        '5e8281b93f83d84d5ab32e51',
        user.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('testing removing a track with invalid artist', async function() {
    let randomTrack = generateTrack(album._id, user._id);
    const dummyTrack = await Track.create(randomTrack);
    const createdArtist = await generateArtist();
    try {
      await trackController.removeTrackLogic(
        dummyTrack._id,
        createdArtist.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
    }
  });
});

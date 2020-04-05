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
const albumController = require('./../controllers/albumController');

describe('Testing album controller', function () {
  this.timeout(10000);
  let user;
  const generatedAlbums = [];
  let createdAlbum;

  this.beforeAll(async function () {
    await dropDB();
  });
  this.beforeEach(async function () {

    user = await generateArtist();



    for (let i = 0; i < 30; i += 1)
      generatedAlbums[i] = generateAlbum([user.id]);
  });
  it('Testing create album', async function () {
    await assert.doesNotReject(async () => {
      createdAlbum = await albumController.createAlbumLogic(
        generatedAlbums[0],
        user.userInfo._id
      );
    });
  });
  it('Testing get album', async function () {
    createdAlbum = await Album.create(generatedAlbums[0]);
    let album = await albumController.getAlbumLogic(createdAlbum.id);
    album = album.toObject();
    createdAlbum = createdAlbum.toObject();
    assert.deepStrictEqual(album, createdAlbum);
  });
  it('Testing get album with invalid ID', async function () {
    try {
      await albumController.getAlbumLogic('5e8281b93f83d84d5ab32e51');
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 404);
    }
  });

  it('Testing get several albums', async function () {
    await Album.findByIdAndDelete(createdAlbum._id);
    const createdAlbums = await Album.create(generatedAlbums);
    const createdIDs = [];
    for (let i = 0; i < 30; i += 1) {
      createdIDs[i] = createdAlbums[i].id;
    }
    const returnedAlbums = await albumController.getSeveralAlbumsLogic(
      createdIDs
    );
    for (let i = 0; i < 20; i += 1) {
      Object.keys(returnedAlbums).forEach(key => {
        assert.deepStrictEqual(returnedAlbums[i][key], createdAlbums[i][key]);
      });
    }
    assert.strictEqual(returnedAlbums.length, 20);
  });
  it('testing getting several Albums with invalid IDs', async function () {
    const returnedAlbums = await albumController.getSeveralAlbumsLogic([
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51'
    ]);
    for (let i = 1; i < returnedAlbums.length; i += 1)
      assert.strictEqual(returnedAlbums[i], null);
  });
  it('Testing get Album tracks', async function () {
    const createdAlbum = await Album.create(generateAlbum(user.id));
    const generatedTracks = [];
    const limit = 5;
    const offset = 0;
    for (let i = 0; i < 10; i += 1)
      generatedTracks[i] = generateTrack(createdAlbum._id, user.id);
    const createdTracks = await Track.create(generatedTracks);
    for (let i = 0; i < generatedTracks.length; i += 1) {
      createdAlbum.tracks.push(createdTracks[i]._id);
    }
    await createdAlbum.save();
    const returnedTracks = await albumController.getAlbumTracksLogic(
      createdAlbum.id,
      limit,
      offset,
      `http://localhost:${
        process.env.PORT
      }/api/v1/albums/tracks?offset=${offset}&limit=${limit}`
    );
    for (let i = 0; i < returnedTracks.length; i += 1)
      assert.deepStrictEqual(returnedTracks.items[i], createdTracks[i]);
    assert.strictEqual(returnedTracks.items.length, limit);
  });
  it('Testing get Album tracks with invalid album id', async function () {
    try {
      await albumController.getAlbumTracksLogic(
        '5e8281b93f83d84d5ab32e51',
        20,
        0
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing validating limit and offset', function () {
    let {
      limit,
      offset
    } = albumController.validateLimitOffset();
    assert.strictEqual(limit, 20);
    assert.strictEqual(offset, 0);
    try {
      limit = albumController.validateLimitOffset(50, 0);
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
    try {
      limit = albumController.validateLimitOffset(-1, 0);
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
  });
});
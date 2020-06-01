const assert = require('assert');
const { dropDB } = require('./../utils/dropDB');
const generateArtist = require('./utils/insertArtistIntoDB');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const Album = require('../models/albumModel');
const albumController = require('./../controllers/albumController');

describe('Testing album controller', function() {
  this.timeout(10000);
  let user;
  const generatedAlbums = [];
  let createdAlbum;

  this.beforeAll(async function() {
    await dropDB();
  });
  this.beforeEach(async function() {
    user = await generateArtist();

    for (let i = 0; i < 30; i += 1)
      generatedAlbums[i] = generateAlbum([user.id]);
  });
  it('Testing create album', async function() {
    await assert.doesNotReject(async () => {
      createdAlbum = await albumController.createAlbumLogic(
        generatedAlbums[0],
        user.userInfo._id
      );
    });
  });
  it('Testing get album', async function() {
    createdAlbum = await Album.create(generatedAlbums[0]);
    let album = await albumController.getAlbumLogic(createdAlbum.id);
    album = album.toObject();
    createdAlbum = createdAlbum.toObject();
    const keys = Object.keys(createdAlbum);
    keys.forEach(key => {
      if (key !== 'tracks' && key !== 'artists')
        assert.deepStrictEqual(album[key], createdAlbum[key]);
    });
  });
  it('Testing get album with invalid ID', async function() {
    try {
      await albumController.getAlbumLogic('5e8281b93f83d84d5ab32e51');
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 404);
    }
  });

  it('Testing get several albums', async function() {
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
  it('testing getting several Albums with invalid IDs', async function() {
    const returnedAlbums = await albumController.getSeveralAlbumsLogic([
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51',
      '5e8281b93f83d84d5ab32e51'
    ]);
    for (let i = 1; i < returnedAlbums.length; i += 1)
      assert.strictEqual(returnedAlbums[i], null);
  });
  it('Testing get Album tracks', async function() {
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
      `http://localhost:${process.env.PORT}/api/v1/albums/tracks?offset=${offset}&limit=${limit}`
    );
    for (let i = 0; i < returnedTracks.length; i += 1)
      assert.deepStrictEqual(returnedTracks.items[i], createdTracks[i]);
    assert.strictEqual(returnedTracks.items.length, limit);
  });
  it('Testing get Album tracks with invalid album id', async function() {
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
  it('Testing upload Image', async function() {
    const createdAlbum = await Album.create(generateAlbum(user.id));
    try {
      await albumController.uploadImageLogic(null, createdAlbum._id);
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
    try {
      await albumController.uploadImageLogic('data', null);
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
    try {
      await albumController.uploadImageLogic(
        'data',
        '5e8281b93f83d84d5ab32e51'
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing getNextAndPrevious', function() {
    let { nextPage, previousPage } = albumController.getNextAndPrevious(
      1,
      1,
      1
    );
    assert.strictEqual(nextPage, null);
    assert.notStrictEqual(previousPage, null);
    let page = albumController.getNextAndPrevious(-1, 1, 1);
    assert.notStrictEqual(page.nextPage, null);
    assert.strictEqual(page.previousPage, null);
  });

  it('testing updating Album with invalid ID', async function() {
    try {
      await albumController.updateAlbumLogic(
        '5e8281b93f83d84d5ab32e51',
        { name: 'numb' },
        '5e8281b93f83d84d5ab32e51'
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('testing updating Album with other artist ID', async function() {
    const dummyAlbum = generateAlbum(user._id);
    const dbAlbum = await Album.create(dummyAlbum);
    const createdArtist = await generateArtist();

    try {
      await albumController.updateAlbumLogic(
        dbAlbum._id,
        { name: 'numb' },
        createdArtist.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
    }
  });
  it('testing updating Album', async function() {
    const dummyAlbum = generateAlbum(user._id);
    const dbAlbum = await Album.create(dummyAlbum);
    const updated = await albumController.updateAlbumLogic(
      dbAlbum._id,
      { name: 'numb' },
      user.userInfo._id
    );
    assert.strictEqual(updated.name, 'numb');
  });
  it('testing removing an album', async function() {
    let randomAlbum = generateAlbum(user._id);
    const dummyAlbum = await Album.create(randomAlbum);
    await albumController.removeAlbumLogic(dummyAlbum._id, user.userInfo._id);
    const returnedAlbum = await Album.findById(dummyAlbum._id);
    assert.strictEqual(returnedAlbum, null);
  });
  it('testing removing a Album with wrong ID', async function() {
    try {
      await albumController.removeAlbumLogic(
        '5e8281b93f83d84d5ab32e51',
        user.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('testing removing a Album with invalid artist', async function() {
    let randomAlbum = generateAlbum(user._id);
    const dummyAlbum = await Album.create(randomAlbum);
    const createdArtist = await generateArtist();
    try {
      await albumController.removeAlbumLogic(
        dummyAlbum._id,
        createdArtist.userInfo._id
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 403);
    }
  });
});

const assert = require('assert');

const { dropDB } = require('./../utils/dropDB');
const generateArtist = require('./utils/insertArtistIntoDB');
const createUser = require('./utils/createUser');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const Album = require('../models/albumModel');
const SavedAlbum = require('../models/savedAlbumModel');
const SavedTrack = require('../models/savedTrackModel');
const libraryController = require('./../controllers/libraryController');

describe('Testing library controller', function() {
  this.timeout(10000);
  const tracks = [];
  let user;
  let artist;
  const albums = [];
  let createdAlbums = [];
  let createdTracks = [];
  this.beforeAll(async function() {
    await dropDB();
  });
  this.beforeEach(async function() {
    artist = await generateArtist();
    user = await User.create(createUser('user'));
    for (let i = 0; i < 10; i += 1) {
      albums[i] = generateAlbum([artist._id]);
    }
    createdAlbums = await Album.create(albums);
  });
  it('Testing Save albums for current user', async function() {
    const albumsIDs = [];
    for (let i = 0; i < albums.length; i += 1) {
      albumsIDs[i] = createdAlbums[i]._id;
    }
    const savedAlbums = await libraryController.saveForCurrentUserLogic(
      albumsIDs,
      Album,
      user
    );
    for (let i = 0; i < savedAlbums.length; i += 1) {
      assert.deepStrictEqual(savedAlbums[i].album, albumsIDs[i]);
    }
  });
  it('Testing Save albums for current user with Invalid IDs', async function() {
    try {
      const savedAlbums = await libraryController.saveForCurrentUserLogic(
        ['5e869a2b5a21c7219c5d8750', '5e869a2b5a21c7219c5d8753'],
        Album,
        user
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing Save tracks for current user', async function() {
    for (let i = 0; i < 10; i += 1)
      tracks[i] = generateTrack(createdAlbums[i].id, [artist._id]);
    const tracksIDs = [];
    createdTracks = await Track.create(tracks);
    for (let i = 0; i < tracks.length; i += 1) {
      tracksIDs[i] = createdTracks[i]._id;
    }
    const savedTracks = await libraryController.saveForCurrentUserLogic(
      tracksIDs,
      Track,
      user
    );
    for (let i = 0; i < savedTracks.length; i += 1) {
      assert.deepStrictEqual(savedTracks[i].track, tracksIDs[i]);
    }
  });
  it('Testing Save album for current user with Invalid IDs', async function() {
    try {
      const savedTracks = await libraryController.saveForCurrentUserLogic(
        ['5e869a2b5a21c7219c5d8750', '5e869a2b5a21c7219c5d8753'],
        Track,
        user
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing remove albums for current user', async function() {
    const savedAlbumsObjects = [];
    const albumsIDs = [];
    for (let i = 0; i < createdAlbums.length; i += 1) {
      savedAlbumsObjects.push({
        album: createdAlbums[i]._id,
        added_at: new Date(),
        user: user._id
      });
      albumsIDs.push(createdAlbums[i]._id);
    }
    await SavedAlbum.create(savedAlbumsObjects);
    assert.doesNotReject(async () => {
      await libraryController.removeUserSavedModelLogic(albumsIDs, user, Album);
    });
  });
  it('Testing remove albums for current user', async function() {
    const savedAlbumsObjects = [];
    const albumsIDs = [];
    for (let i = 0; i < createdAlbums.length; i += 1) {
      albumsIDs.push(createdAlbums[i]._id);
    }
    try {
      await libraryController.removeUserSavedModelLogic(
        albumsIDs[0],
        user,
        Album
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing remove track for current user with non existing saved track', async function() {
    const savedTracksObjects = [];
    for (let i = 0; i < 10; i += 1)
      tracks[i] = generateTrack(createdAlbums[i].id, [artist._id]);
    const tracksIDs = [];
    createdTracks = await Track.create(tracks);
    for (let i = 0; i < tracks.length; i += 1) {
      tracksIDs[i] = createdTracks[i]._id;
    }
    try {
      await libraryController.removeUserSavedModelLogic(
        tracksIDs[0],
        user,
        Track
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing remove tracks for current user', async function() {
    const savedTracksObjects = [];
    for (let i = 0; i < 10; i += 1)
      tracks[i] = generateTrack(createdAlbums[i].id, [artist._id]);
    const tracksIDs = [];
    createdTracks = await Track.create(tracks);
    for (let i = 0; i < tracks.length; i += 1) {
      tracksIDs[i] = createdTracks[i]._id;
    }
    for (let i = 0; i < createdTracks.length; i += 1) {
      savedTracksObjects.push({
        track: createdTracks[i]._id,
        added_at: new Date(),
        user: user._id
      });
      tracksIDs.push(createdTracks[i]._id);
    }
    await SavedTrack.create(savedTracksObjects);
    assert.doesNotReject(async () => {
      await libraryController.removeUserSavedModelLogic(tracksIDs, user, Track);
    });
  });
  it('Testing check users saved albums', async function() {
    const savedAlbumsObjects = [];
    const albumsIDs = [];
    for (let i = 0; i < createdAlbums.length; i += 1) {
      savedAlbumsObjects.push({
        album: createdAlbums[i]._id,
        added_at: new Date(),
        user: user._id
      });
      albumsIDs.push(createdAlbums[i]._id);
    }
    await SavedAlbum.create(savedAlbumsObjects);
    const boolArray = await libraryController.checkUsersSavedModelLogic(
      albumsIDs,
      Album
    );
    boolArray.forEach(el => {
      assert.strictEqual(el, true);
    });
  });
  it('Testing check users saved tracks', async function() {
    const savedTracksObjects = [];
    for (let i = 0; i < 10; i += 1)
      tracks[i] = generateTrack(createdAlbums[i].id, [artist._id]);
    const tracksIDs = [];
    createdTracks = await Track.create(tracks);
    for (let i = 0; i < albums.length; i += 1) {
      tracksIDs[i] = createdTracks[i]._id;
    }
    for (let i = 0; i < createdAlbums.length; i += 1) {
      savedTracksObjects.push({
        track: createdTracks[i]._id,
        added_at: new Date(),
        user: user._id
      });
    }
    await SavedTrack.create(savedTracksObjects);
    const boolArray = await libraryController.checkUsersSavedModelLogic(
      tracksIDs,
      Track
    );
    boolArray.forEach(el => {
      assert.strictEqual(el, true);
    });
  });
  it('Testing check users saved albums with invalid ids', async function() {
    const savedAlbumsObjects = [];
    const albumsIDs = [];
    for (let i = 0; i < createdAlbums.length; i += 1) {
      savedAlbumsObjects.push({
        album: createdAlbums[i]._id,
        added_at: new Date(),
        user: user._id
      });
      albumsIDs.push(createdAlbums[i]._id);
    }
    await SavedAlbum.create(savedAlbumsObjects);
    const boolArray = await libraryController.checkUsersSavedModelLogic(
      ['5e869a2b5a21c7219c5d8750', '5e869a2b5a21c7219c5d8750'],
      Album
    );
    boolArray.forEach(el => {
      assert.strictEqual(el, false);
    });
  });
  it('Testing check users saved tracks with invalid ids', async function() {
    const savedTracksObjects = [];
    for (let i = 0; i < 10; i += 1)
      tracks[i] = generateTrack(createdAlbums[i].id, [artist._id]);
    const tracksIDs = [];
    createdTracks = await Track.create(tracks);
    for (let i = 0; i < albums.length; i += 1) {
      tracksIDs[i] = createdTracks[i]._id;
    }
    for (let i = 0; i < createdTracks.length; i += 1) {
      savedTracksObjects.push({
        track: createdTracks[i]._id,
        added_at: new Date(),
        user: user._id
      });
    }
    await SavedTrack.create(savedTracksObjects);
    const boolArray = await libraryController.checkUsersSavedModelLogic(
      ['5e869a2b5a21c7219c5d8750', '5e869a2b5a21c7219c5d8750'],
      Track
    );
    boolArray.forEach(el => {
      assert.strictEqual(el, false);
    });
  });
  it('Testing get saved tracks', async function() {
    const savedTracksObjects = [];
    for (let i = 0; i < 10; i += 1)
      tracks[i] = generateTrack(createdAlbums[i].id, [artist._id]);
    const tracksIDs = [];
    createdTracks = await Track.create(tracks);
    for (let i = 0; i < albums.length; i += 1) {
      tracksIDs[i] = createdTracks[i]._id;
    }
    for (let i = 0; i < createdTracks.length; i += 1) {
      savedTracksObjects.push({
        track: createdTracks[i]._id,
        added_at: new Date(),
        user: user._id
      });
    }
    const manuallySavedObjects = await SavedTrack.create(savedTracksObjects);
    const returnedSavedObjects = await libraryController.getSavedModelLogic(
      user,
      11,
      0,
      Track,
      '/tracks'
    );
    returnedSavedObjects.items.forEach(el => {
      let found = false;
      for (let i = 0; i < manuallySavedObjects.length; i++) {
        if (el.track.id == manuallySavedObjects[i].track) found = true;
      }
      assert.strictEqual(found, true);
    });
  });
  it('Testing get saved albums', async function() {
    const savedAlbumsObjects = [];
    const albumsIDs = [];
    for (let i = 0; i < createdAlbums.length; i += 1) {
      savedAlbumsObjects.push({
        album: createdAlbums[i]._id,
        added_at: new Date(),
        user: user._id
      });
      albumsIDs.push(createdAlbums[i]._id);
    }
    const manuallySavedObjects = await SavedAlbum.create(savedAlbumsObjects);
    const returnedSavedObjects = await libraryController.getSavedModelLogic(
      user,
      10,
      0,
      Track,
      '/albums'
    );
    returnedSavedObjects.items.forEach(el => {
      let found = false;
      for (let i = 0; i < manuallySavedObjects.length; i++) {
        if (el.album.id == manuallySavedObjects[i].album) found = true;
      }
      assert.strictEqual(found, true);
    });
  });
  it('Testing get saved model with invalid model', async function() {
    try {
      await libraryController.getSavedModelLogic(
        user,
        10,
        0,
        SavedAlbum,
        '/tracks'
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
  });
});

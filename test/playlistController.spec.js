/* eslint-disable no-await-in-loop */
const assert = require('assert');
const connectDB = require('./connectDB');
const disconnectDB = require('./disconnectDB');
const dropDB = require('./dropDB');
const generateUser = require('./utils/createUser');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');
const generatePlaylist = require('./utils/generatePlaylist');
const Playlist = require('../models/playlistModel');
const User = require('../models/userModel');
const Track = require('../models/trackModel');
const Album = require('../models/albumModel');
const playlistController = require('../controllers/playlistController');
const insertArtist = require('./utils/insertArtistIntoDB');

describe('Testing Playlist Controller', function() {
  this.beforeAll(async () => {
    await connectDB();
    await dropDB();
  });

  it('Get A Playlist', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    assert.ok(playlistId);

    const returnedPlaylist = await playlistController.getPlaylistLogic(
      playlistId,
      userId
    );

    const fieldsToCheck = [
      'public',
      'collaborative',
      'name',
      'id',
      'description',
      'tracks.items'
    ];

    fieldsToCheck.forEach(key => {
      assert.deepStrictEqual(returnedPlaylist[key], insertedPlaylist[key]);
    });

    assert.deepStrictEqual(String(returnedPlaylist.owner.id), String(userId));
  });

  it('Get A Playlist with fields', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    assert.ok(playlistId);

    const queryParams = {
      fields: 'name, public'
    };

    const returnedPlaylist = await playlistController.getPlaylistLogic(
      playlistId,
      userId,
      queryParams
    );

    const fieldsToCheck = [
      'public',
      'collaborative',
      'name',
      'id',
      'description',
      'tracks.items',
      'owner'
    ];

    fieldsToCheck.forEach(key => {
      if (key === 'public' || key === 'name')
        assert.deepStrictEqual(returnedPlaylist[key], insertedPlaylist[key]);
      else assert.ok(returnedPlaylist.key === undefined);
    });
  });

  it('Get A Playlist returns 404', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    assert.ok(playlistId);

    await Playlist.findByIdAndDelete(playlistId);

    try {
      await playlistController.getPlaylistLogic(playlistId, userId);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 404);
    }
  });

  it('Get A Playlist returns 403', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    generatedPlaylist.public = false;
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const insertedForbiddenUser = generateUser();
    const forbiddenUser = await User.create(insertedForbiddenUser);
    const forbiddenUserId = forbiddenUser._id;

    assert.ok(playlistId);

    try {
      await playlistController.getPlaylistLogic(playlistId, forbiddenUserId);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 403);
    }
  });

  it("Get A Playlist's Tracks with tracks", async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const returnedPlaylistTracks = await playlistController.getPlaylistTracksLogic(
      playlistId,
      userId
    );

    assert.deepStrictEqual(
      returnedPlaylistTracks.items.length,
      insertedPlaylist.tracks.items.length
    );

    for (let i = 0; i < insertedPlaylist.tracks.items.length; i += 1) {
      assert.deepStrictEqual(
        insertedPlaylist.tracks.items[i]._id,
        returnedPlaylistTracks.items[i]._id
      );
    }
  });

  it("Get A Playlist's Tracks with fields", async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    assert.ok(playlistId);

    const queryParams = {
      fields: 'items(added_at,added_by)'
    };

    const returnedPlaylistTracks = await playlistController.getPlaylistTracksLogic(
      playlistId,
      userId,
      queryParams
    );

    const fieldsToCheck = ['added_at', 'added_by', 'track', 'is_local'];

    returnedPlaylistTracks.items.forEach(el => {
      fieldsToCheck.forEach(key => {
        if (key === 'added_at' || key === 'added_by')
          assert.ok(el[key] !== undefined);
        else assert.ok(el[key] === undefined);
      });
    });
  });

  it("Get A Playlist's Tracks without tracks", async function() {
    const tracksIds = [];

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const returnedPlaylistTracks = await playlistController.getPlaylistTracksLogic(
      playlistId,
      userId
    );

    assert.deepStrictEqual(
      returnedPlaylistTracks.items.length,
      insertedPlaylist.tracks.items.length
    );

    for (let i = 0; i < insertedPlaylist.tracks.items.length; i += 1) {
      assert.deepStrictEqual(
        insertedPlaylist.tracks.items[i]._id,
        returnedPlaylistTracks.items[i]._id
      );
    }
  });

  it('Get A Playlist returns 404', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    assert.ok(playlistId);

    await Playlist.findByIdAndDelete(playlistId);

    try {
      await playlistController.getPlaylistTracksLogic(playlistId, userId);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 404);
    }
  });

  it("Get A Playlist's Tracks returns 403", async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    generatedPlaylist.public = false;
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const insertedForbiddenUser = generateUser();
    const forbiddenUser = await User.create(insertedForbiddenUser);
    const forbiddenUserId = forbiddenUser._id;

    assert.ok(playlistId);

    try {
      await playlistController.getPlaylistTracksLogic(
        playlistId,
        forbiddenUserId
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 403);
    }
  });

  it('Add Tracks to an empty Playlist', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    let oldTracksArray = insertedPlaylist.tracks.items.map(el => el.track);

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      tracksIds
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items.map(
      el => el.track
    );

    oldTracksArray = oldTracksArray.concat(tracksIds);
    assert.deepStrictEqual(newTracksArray, oldTracksArray);
  });

  it('Add Tracks to a Playlist with tracks', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const toBeAddedTracksIds = [];

    for (let i = 0; i < 3; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      toBeAddedTracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    let oldTracksArray = insertedPlaylist.tracks.items.map(el => el.track);

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      toBeAddedTracksIds
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items.map(
      el => el.track
    );

    oldTracksArray = oldTracksArray.concat(toBeAddedTracksIds);

    assert.deepStrictEqual(newTracksArray, oldTracksArray);
  });

  it('Add Tracks to a Playlist with tracks and position at 2', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const toBeAddedTracksIds = [];

    for (let i = 0; i < 3; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      toBeAddedTracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    let oldTracksArray = insertedPlaylist.tracks.items.map(el => el.track);

    const newPositionOfTracks = 2;

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      toBeAddedTracksIds,
      newPositionOfTracks
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items.map(
      el => el.track
    );

    const tempOldTracksArray = oldTracksArray.splice(newPositionOfTracks);
    oldTracksArray = oldTracksArray.concat(toBeAddedTracksIds);
    oldTracksArray = oldTracksArray.concat(tempOldTracksArray);

    assert.deepStrictEqual(newTracksArray, oldTracksArray);
  });

  it('Add Tracks to a Playlist with tracks and position at 0', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const toBeAddedTracksIds = [];

    for (let i = 0; i < 3; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      toBeAddedTracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    let oldTracksArray = insertedPlaylist.tracks.items.map(el => el.track);

    const newPositionOfTracks = 0;

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      toBeAddedTracksIds,
      newPositionOfTracks
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items.map(
      el => el.track
    );

    const tempOldTracksArray = oldTracksArray.splice(newPositionOfTracks);
    oldTracksArray = oldTracksArray.concat(toBeAddedTracksIds);
    oldTracksArray = oldTracksArray.concat(tempOldTracksArray);

    assert.deepStrictEqual(newTracksArray, oldTracksArray);
  });

  it('Add tracks to Playlist returns 404', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    assert.ok(playlistId);

    await Playlist.findByIdAndDelete(playlistId);

    try {
      await playlistController.addPlaylistTrackLogic(
        playlistId,
        userId,
        tracksIds
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 404);
    }
  });

  it("Get A Playlist's Tracks returns 403", async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      tracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    generatedPlaylist.public = false;
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const insertedForbiddenUser = generateUser();
    const forbiddenUser = await User.create(insertedForbiddenUser);
    const forbiddenUserId = forbiddenUser._id;

    assert.ok(playlistId);

    try {
      await playlistController.addPlaylistTrackLogic(
        playlistId,
        forbiddenUserId,
        tracksIds
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 403);
    }
  });

  it("Get A Playlist's Tracks returns 400", async function() {
    const tracksIds = [];

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    generatedPlaylist.public = false;
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const insertedForbiddenUser = generateUser();
    const forbiddenUser = await User.create(insertedForbiddenUser);
    const forbiddenUserId = forbiddenUser._id;

    assert.ok(playlistId);

    try {
      await playlistController.addPlaylistTrackLogic(
        playlistId,
        forbiddenUserId,
        tracksIds
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  this.afterAll(async () => {
    await disconnectDB();
  });
});

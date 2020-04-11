/* eslint-disable no-await-in-loop */
const assert = require('assert');

const { dropDB } = require('./../utils/dropDB');
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
  this.beforeAll('Playlist', async () => {
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

    const returnedTracks = returnedPlaylistTracks.items.toObject();
    const insertedTracks = insertedPlaylist.tracks.items.toObject();

    assert.deepStrictEqual(returnedTracks.length, insertedTracks.length);

    for (let i = 0; i < insertedTracks.length; i += 1) {
      assert.deepStrictEqual(returnedTracks[i]._id, insertedTracks[i]._id);
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

  it('Add Tracks to a Playlist over limit throws 403', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const toBeAddedTracksIds = [];
    const generatedTrack = generateTrack(albumId, artistId);
    const insertedTrack = await Track.create(generatedTrack);
    const trackId = insertedTrack._id;
    for (let i = 0; i < 20000; i += 1) {
      toBeAddedTracksIds.push(trackId);
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    try {
      await playlistController.addPlaylistTrackLogic(
        playlistId,
        userId,
        toBeAddedTracksIds
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 403);
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

    let oldTracksArray = insertedPlaylist.tracks.items
      .toObject()
      .map(el => el.track);

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      tracksIds
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items
      .toObject()
      .map(el => el.track);

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

    let oldTracksArray = insertedPlaylist.tracks.items
      .toObject()
      .map(el => el.track);

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      toBeAddedTracksIds
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items
      .toObject()
      .map(el => el.track);

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

    let oldTracksArray = insertedPlaylist.tracks.items
      .toObject()
      .map(el => el.track);

    const newPositionOfTracks = 2;

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      toBeAddedTracksIds,
      newPositionOfTracks
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items
      .toObject()
      .map(el => el.track);

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

    let oldTracksArray = insertedPlaylist.tracks.items
      .toObject()
      .map(el => el.track);

    const newPositionOfTracks = 0;

    await playlistController.addPlaylistTrackLogic(
      playlistId,
      userId,
      toBeAddedTracksIds,
      newPositionOfTracks
    );

    const playlistAfterAddingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterAddingTracks.tracks.items
      .toObject()
      .map(el => el.track);

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

  it('Get Playlists of User with no playlists', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const returnedPlaylists = await playlistController.getUserPlaylistsLogic(
      userId
    );

    assert.deepStrictEqual(returnedPlaylists.items.length, 0);
  });

  it('Get User Playlists throws 400 when limit query out of range', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const queryParams = {
      limit: -5
    };

    try {
      await playlistController.getUserPlaylistsLogic(userId, queryParams);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }

    queryParams.limit = 50000;

    try {
      await playlistController.getUserPlaylistsLogic(userId, queryParams);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('Get User Playlists throws 400 when offset query out of range', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const queryParams = {
      offset: -5
    };

    try {
      await playlistController.getUserPlaylistsLogic(userId, queryParams);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }

    queryParams.limit = 9999999999;

    try {
      await playlistController.getUserPlaylistsLogic(userId, queryParams);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('Get Playlists of User with playlists', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const playlistsIds = [];

    for (let i = 0; i < 5; i += 1) {
      const generatedPlaylist = generatePlaylist(userId);
      const insertedPlaylist = await Playlist.create(generatedPlaylist);
      const playlistId = insertedPlaylist._id;
      playlistsIds.push(playlistId);
    }

    const returnedPlaylists = (
      await playlistController.getUserPlaylistsLogic(userId)
    ).items;

    const returnedPlaylistsIds = returnedPlaylists.map(el => el._id);

    assert.deepStrictEqual(returnedPlaylistsIds, playlistsIds);
  });

  it("Change Playlist's details with allowed fields", async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = (
      await Playlist.create(generatedPlaylist)
    ).toObject();
    const playlistId = insertedPlaylist._id;

    const bodyParams = {
      name: 'newName',
      description: 'newDescription'
    };

    await playlistController.changePlaylistDetailsLogic(
      bodyParams,
      playlistId,
      userId
    );

    const changedPlaylist = (await Playlist.findById(playlistId)).toObject();

    Object.keys(changedPlaylist).forEach(key => {
      if (key === '__v') return;
      if (key === 'name' || key === 'description')
        assert.deepStrictEqual(changedPlaylist[key], bodyParams[key]);
      else assert.deepStrictEqual(changedPlaylist[key], insertedPlaylist[key]);
    });
  });

  it("Change Playlist's details with disallowed fields", async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = (
      await Playlist.create(generatedPlaylist)
    ).toObject();
    const playlistId = insertedPlaylist._id;

    const bodyParams = {
      name: 'newName',
      description: 'newDescription',
      owner: 'poison',
      newProperty: 'new'
    };

    await playlistController.changePlaylistDetailsLogic(
      bodyParams,
      playlistId,
      userId
    );

    const changedPlaylist = (await Playlist.findById(playlistId)).toObject();

    Object.keys(changedPlaylist).forEach(key => {
      if (key === '__v') return;
      if (key === 'name' || key === 'description')
        assert.deepStrictEqual(changedPlaylist[key], bodyParams[key]);
      else assert.deepStrictEqual(changedPlaylist[key], insertedPlaylist[key]);
    });
  });

  it("Change Playlist's Details returns 404", async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    assert.ok(playlistId);

    await Playlist.findByIdAndDelete(playlistId);

    const bodyParams = {};

    try {
      await playlistController.changePlaylistDetailsLogic(
        bodyParams,
        playlistId,
        userId
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 404);
    }
  });

  it("Change Playlist's Details returns 403", async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const newGeneratedUser = generateUser();
    const newInsertedUser = await User.create(newGeneratedUser);
    const newUserId = newInsertedUser._id;

    const bodyParams = {
      name: 'unauthorized name'
    };

    try {
      await playlistController.changePlaylistDetailsLogic(
        bodyParams,
        playlistId,
        newUserId
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 403);
    }
  });

  it('Remove Tracks from Playlist with no positions', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];
    const correctTracksAfterDeletion = [];

    for (let i = 0; i < 4; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      for (let j = 0; j <= i; j += 1) {
        tracksIds.push(trackId);
        if (i !== 2 && i !== 0) correctTracksAfterDeletion.push(trackId);
      }
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const requestTracks = [
      {
        id: String(tracksIds[3])
      },
      {
        id: String(tracksIds[0])
      }
    ];

    await playlistController.deletePlaylistTrackLogic(
      playlistId,
      userId,
      requestTracks
    );

    const itemsAfterDeletion = Array.from(
      (await Playlist.findById(playlistId).select('tracks')).tracks.items
        .toObject()
        .map(el => el.track)
    );

    assert.deepStrictEqual(itemsAfterDeletion, correctTracksAfterDeletion);
  });

  it('Remove Tracks from Playlist with positions', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];
    const correctTracksAfterDeletion = [];

    for (let i = 0; i < 4; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      for (let j = 0; j <= i; j += 1) {
        tracksIds.push(trackId);
        if (i !== 2 && i !== 0) correctTracksAfterDeletion.push(trackId);
      }
    }

    tracksIds.push(tracksIds[0]);

    correctTracksAfterDeletion.splice(1, 1);

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const requestTracks = [
      {
        id: String(tracksIds[3])
      },
      {
        id: String(tracksIds[1]),
        positions: [1]
      },
      {
        id: String(tracksIds[0]),
        positions: [0, 10]
      }
    ];

    await playlistController.deletePlaylistTrackLogic(
      playlistId,
      userId,
      requestTracks
    );

    const itemsAfterDeletion = Array.from(
      (await Playlist.findById(playlistId).select('tracks')).tracks.items
        .toObject()
        .map(el => el.track)
    );

    assert.deepStrictEqual(itemsAfterDeletion, correctTracksAfterDeletion);
  });

  it('Remove Tracks from Playlist with incorrect positions returns 400', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 4; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      for (let j = 0; j <= i; j += 1) {
        tracksIds.push(trackId);
      }
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const requestTracks = [
      {
        id: String(tracksIds[3])
      },
      {
        id: String(tracksIds[1]),
        positions: [6]
      }
    ];
    try {
      await playlistController.deletePlaylistTrackLogic(
        playlistId,
        userId,
        requestTracks
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('Remove Tracks from Playlist with invalid request body returns 400', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 4; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      for (let j = 0; j <= i; j += 1) {
        tracksIds.push(trackId);
      }
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const requestTracks = [
      {
        id: String(tracksIds[3])
      },
      {
        Xid: String(tracksIds[1]),
        Xpositions: [6]
      }
    ];

    try {
      await playlistController.deletePlaylistTrackLogic(
        playlistId,
        userId,
        requestTracks
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('Remove Tracks from Playlist with no requests tracks throws 400', async function() {
    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    try {
      await playlistController.deletePlaylistTrackLogic(
        playlistId,
        userId,
        undefined
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it("Remove Tracks from Playlist that doesn't exist throws 404", async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];
    const correctTracksAfterDeletion = [];

    for (let i = 0; i < 4; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      for (let j = 0; j <= i; j += 1) {
        tracksIds.push(trackId);
        if (i !== 2 && i !== 0) correctTracksAfterDeletion.push(trackId);
      }
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId, tracksIds);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    await Playlist.findByIdAndDelete(playlistId);

    const requestTracks = [
      {
        id: String(tracksIds[3])
      },
      {
        id: String(tracksIds[0])
      }
    ];
    try {
      await playlistController.deletePlaylistTrackLogic(
        playlistId,
        userId,
        requestTracks
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 404);
    }
  });

  it('Remove Tracks from Playlist that has no tracks throws 400', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];
    const correctTracksAfterDeletion = [];

    for (let i = 0; i < 4; i += 1) {
      const generatedTrack = generateTrack(albumId, artistId);
      const insertedTrack = await Track.create(generatedTrack);
      const trackId = insertedTrack._id;
      for (let j = 0; j <= i; j += 1) {
        tracksIds.push(trackId);
        if (i !== 2 && i !== 0) correctTracksAfterDeletion.push(trackId);
      }
    }

    const generatedUser = generateUser();
    const insertedUser = await User.create(generatedUser);
    const userId = insertedUser._id;

    const generatedPlaylist = generatePlaylist(userId);
    const insertedPlaylist = await Playlist.create(generatedPlaylist);
    const playlistId = insertedPlaylist._id;

    const requestTracks = [
      {
        id: String(tracksIds[3])
      },
      {
        id: String(tracksIds[0])
      }
    ];
    try {
      await playlistController.deletePlaylistTrackLogic(
        playlistId,
        userId,
        requestTracks
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('Reorder Playlist Tracks works properly', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 10; i += 1) {
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

    const oldTracksArray = insertedPlaylist.tracks.items.toObject();

    const toBeReorderedtracks = oldTracksArray.splice(2, 2);
    oldTracksArray.splice(4, 0, ...toBeReorderedtracks);

    await playlistController.reorderPlaylistTracksLogic(
      playlistId,
      userId,
      2,
      2,
      6
    );

    const playlistAfterReorderingTracks = await Playlist.findById(playlistId);

    const newTracksArray = playlistAfterReorderingTracks.tracks.items.toObject();

    assert.deepStrictEqual(newTracksArray, oldTracksArray);
  });

  it('Reorder Playlist Tracks with invalid parameters throws 400', async function() {
    const insertedArtist = await insertArtist();
    const artistId = insertedArtist._id;

    const generatedAlbum = generateAlbum(artistId);
    const insertedAlbum = await Album.create(generatedAlbum);

    const albumId = insertedAlbum._id;

    const tracksIds = [];

    for (let i = 0; i < 3; i += 1) {
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

    const oldTracksArray = insertedPlaylist.tracks.items.toObject();

    const toBeReorderedtracks = oldTracksArray.splice(2, 2);
    oldTracksArray.splice(4, 0, ...toBeReorderedtracks);

    try {
      await playlistController.reorderPlaylistTracksLogic(
        playlistId,
        userId,
        undefined,
        2,
        6
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }

    try {
      await playlistController.reorderPlaylistTracksLogic(
        playlistId,
        userId,
        2,
        6,
        3
      );
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('validateLimitOffset throws error when limit<0', async function() {
    try {
      playlistController.validateLimitOffsetLogic(-5);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('validateLimitOffset throws error when limit>100', async function() {
    try {
      playlistController.validateLimitOffsetLogic(500);
      assert.ok(false);
    } catch (err) {
      assert.deepStrictEqual(err.statusCode, 400);
    }
  });

  it('authorizeUserToPlaylist throws 400 when parameters not specified', async function() {
    let catched = 0;
    await playlistController
      .authorizeUserToPlaylistLogic(undefined, undefined)
      .catch(err => {
        catched = 1;
        assert.deepStrictEqual(err.statusCode, 400);
      });
    assert.deepStrictEqual(catched, 1);
  });
});

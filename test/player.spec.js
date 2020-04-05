const assert = require('assert');
const faker = require('faker');
const { dropDB } = require('./dropDB');
const playerController = require('../controllers/playerController');
const authenticationController = require('../controllers/authenticationController');
const { ObjectId } = require('mongoose').Types;

const Artist = require('./../models/artistModel');
const User = require('./../models/userModel');
const Track = require('./../models/trackModel');
const Album = require('./../models/albumModel');
const PlayHistory = require('./../models/playHistoryModel');

const createUser = require('./utils/createUser');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');

describe('Testing Player Services', function() {
  this.timeout(100000000);
  let user;
  let artist;
  let album;
  let track;
  const numberOfPlayedTracks = Math.floor(Math.random() * 20) + 1;
  const startTimestamp = Date.now();
  const userBody = createUser('user');
  const artistBody = createUser('artist');
  this.beforeAll(async () => {
    await dropDB();

    user = await authenticationController.createNewUser(userBody);
    assert.ok(user, 'Could not create user in db');
    artist = await authenticationController.createNewUser(artistBody);
    assert.ok(artist, 'Could not create artist in db');
    artist = await authenticationController.getPublicUser(artist);
    assert.ok(artist, 'Could not get artist from in db');

    assert.ok(user, 'Could Not Create A User In DB');
    album = await Album.create(generateAlbum([artist._id]));
    assert.ok(album, 'Could Not Create An Album In DB');
    track = await Track.create(generateTrack(album._id, [artist._id]));

    let trk;
    let record;
    // Generate a group of tracks at certain timestamps:
    for (let i = 0; i < numberOfPlayedTracks; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      trk = await Track.create(generateTrack(album._id, [artist._id]));
      // eslint-disable-next-line no-await-in-loop
      record = await PlayHistory.create({
        track: trk._id,
        user: user._id,
        played_at: startTimestamp - 86400000 * i //24*3600*1000 --> 1 day before the previous one
      });
    }
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'currentlyPlaying.timestamp': record.played_at,
        'currentlyPlaying.track': record.track
      }
    });
    assert.ok(track, 'Could Not Create A Track In DB');
  });

  describe(`Update User's currenly playing track`, function() {
    it(`Should Assert That A Track Is Added To User's Current Playback`, async function() {
      await playerController.updateUserCurrentPlayingTrack(user._id, track._id);

      user = await User.findById(user._id);
      assert.ok(
        user.currentlyPlaying.track.equals(track._id),
        `The user's playback was not saved.`
      );
    });
  });

  describe(`Add to User's play history`, function() {
    it(`Should Assert That A Track Is Added To User's Play History`, async function() {
      const time = Date.now();
      await playerController.saveTrackToHistory(user._id, track._id, time);

      const record = await PlayHistory.findOne({
        user: new ObjectId(user._id),
        played_at: time
      });
      assert.ok(record, `The User's Play History Is Not Updated!`);
      try {
        await PlayHistory.findByIdAndDelete(record._id);
      } catch (err) {
        assert.ok(false, 'Could Not delete the record');
      }
    });
  });

  describe(`Get User's Recently Played Tracks`, function() {
    it(`Should Assert That The User's X Recently Played Tracks are returned`, async function() {
      const before = startTimestamp + 1;
      const after = null;
      //   const randomBoolean = Math.random() >= 0.5;
      //   let before;
      //   let after;
      //   if (randomBoolean) before = timestamp;
      //   else after = timestamp;

      const limit = Math.floor(Math.random() * 50) + 1;

      const recentlyPlayed = await playerController.getRecentlyPlayedService(
        user._id,
        limit,
        before,
        after
      );
      assert.ok(
        recentlyPlayed,
        `There Was An Error In Returning The User's Recently Played Track.`
      );

      const num = limit > numberOfPlayedTracks ? numberOfPlayedTracks : limit;
      assert.ok(
        recentlyPlayed.length === num,
        'The Specified limit is not satisfied.'
      );
    });

    it(`Should assert that the user's recently played tracks before and after a certain timestamp works properly`, async function() {
      const limit = Math.floor(Math.random() * 50) + 1;

      let recentlyPlayed = await playerController.getRecentlyPlayedService(
        user._id,
        limit,
        null,
        startTimestamp
      );

      assert.ok(
        recentlyPlayed.length === 0,
        'The Returned Recently Played Tracks Must Be Zero -- (1)'
      );

      recentlyPlayed = await playerController.getRecentlyPlayedService(
        user._id,
        limit,
        startTimestamp - (numberOfPlayedTracks - 1) * 86400000,
        null
      );

      assert.ok(
        recentlyPlayed.length === 0,
        'The Returned Recently Played Tracks Must Be Zero -- (2)'
      );
    });
  });
});

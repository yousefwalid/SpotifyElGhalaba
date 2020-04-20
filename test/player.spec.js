const assert = require('assert');
const faker = require('faker');
const mongoose = require('mongoose');

const playerController = require('../controllers/playerController');
const authenticationController = require('../controllers/authenticationController');
const { ObjectId } = require('mongoose').Types;
const { dropDB } = require('./../utils/dropDB');
const Artist = require('./../models/artistModel');
const User = require('./../models/userModel');
const Track = require('./../models/trackModel');
const Album = require('./../models/albumModel');
const PlayHistory = require('./../models/playHistoryModel');

const createUser = require('./utils/createUser');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');

describe('Testing Player Services', function() {
  // this.timeout(100000000);
  let user;
  let artistUserInfo;
  let artist;
  let album;
  let track;
  const numberOfPlayedTracks = Math.floor(Math.random() * 20) + 1;
  const startTimestamp = Date.now();
  const userBody = createUser('user');
  const artistBody = createUser('artist');
  before('Player', async () => {
    await dropDB();

    user = await User.create(userBody);
    assert.ok(user, 'Could not create user in db');
    artistUserInfo = await User.create(artistBody);
    artist = await Artist.create({ userInfo: artistUserInfo._id });
    assert.ok(artist, 'Could not create artist in db');
    // artist = await authenticationController.getPublicUser(artist);
    // assert.ok(artist, 'Could not get artist from in db');
    assert.ok(user, 'Could Not Create A User In DB');

    assert.ok(await User.findById(user._id), 'The user has GONE from DB!');

    album = await Album.create(generateAlbum([artist._id]));
    assert.ok(album, 'Could Not Create An Album In DB');
    track = await Track.create(generateTrack(album._id, [artist._id]));

    // console.log(user);
    // console.log(artist);

    let trk;
    let record;
    // Generate a group of tracks at certain timestamps:
    for (let i = 0; i < numberOfPlayedTracks; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      trk = await Track.create(generateTrack(album._id, [artist._id]));
      // eslint-disable-next-line no-await-in-loop
      record = await PlayHistory.create({
        track: new ObjectId(trk._id),
        user: new ObjectId(user._id),
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

  // describe(`Update User's currenly playing track`, function() {
  //   it(`Should Assert That A Track Is Added To User's Current Playback`, async function() {
  //     await playerController.updateUserCurrentPlayingTrack(user._id, track._id);
  //     user = await User.findById(user._id);
  //     assert.ok(
  //       user.currentlyPlaying.track.equals(track._id),
  //       `The user's playback was not saved.`
  //     );
  //   });
  // });

  describe(`Add to User's play history`, function() {
    // it(`Should Assert That A Track Is Added To User's Play History`, async function() {
    //   const time = Date.now();
    //   await playerController.saveTrackToHistory(user._id, track._id, time);
    //   const record = await PlayHistory.findOne({
    //     user: new ObjectId(user._id),
    //     played_at: time
    //   });
    //   assert.ok(record, `The User's Play History Is Not Updated!`);
    //   try {
    //     await PlayHistory.findByIdAndDelete(record._id);
    //   } catch (err) {
    //     assert.ok(false, 'Could Not delete the record');
    //   }
    // });

    it(`Should throw error if userId is invalid`, async function() {
      const time = Date.now();

      assert.rejects(async () => {
        await playerController.saveTrackToHistory(
          mongoose.Types.ObjectId(),
          track._id,
          time
        );
      }, `An expected error is not thrown.`);
    });
    it(`Should throw error if trackId is invalid`, async function() {
      const time = Date.now();

      assert.rejects(async () => {
        await playerController.saveTrackToHistory(
          user._id,
          mongoose.Types.ObjectId(),
          time
        );
      }, `An expected error is not thrown.`);
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
  describe('Test Query Paramters Validation Functions', function() {
    const wrongPosition1 = (Math.random() + 10).toString();
    const wrongPosition2 = (
      -1 *
      (Math.floor(Math.random() * 100) + 1)
    ).toString();
    const correctPosition = Math.floor(Math.random() * 10000);
    const wrongRepeat1 = 'a';
    const wrongRepeat2 = '1';
    const wrongRepeat3 = '0';
    const correctRepeat = 'true';
    const wrongShuffle1 = 'a';
    const wrongShuffle2 = '1';
    const wrongShuffle3 = '0';
    const correctShuffle = 'true';
    const wrongVolume1 = 'a';
    const wrongVolume2 = (-1 * (Math.floor(Math.random() * 10) + 1)).toString();
    const wrongVolume3 = (Math.random() + 10).toString();
    const wrongVolume4 = Math.floor(Math.random() * 10) + 101;
    const correctVolume = Math.floor(Math.random() * 102);
    const wrongRecentlyPlayed1 = ['a', null, '5'];
    const wrongRecentlyPlayed2 = [null, 'a', '5'];
    const wrongRecentlyPlayed3 = [null, 1, 'a'];
    const wrongRecentlyPlayed4 = ['-20', null, '5'];
    const wrongRecentlyPlayed5 = ['3', '10', '5'];
    const wrongRecentlyPlayed6 = [
      '20',
      null,
      (Math.floor(Math.random() * 10) + 51).toString()
    ];
    const correctRecentlyPlayed = ['2', null, '5'];

    it('Should throw error for invalid query parameters', function() {
      const req = { query: {} };
      const next = err => {
        if (err) throw err;
      };
      const res = {};
      req.query.position_ms = wrongPosition1;
      assert.throws(() => {
        playerController.validateSeek(req, res, next);
      }, `Invalid Parameter Validation Function For Seek`);
      req.query.position_ms = wrongPosition2;
      assert.throws(() => {
        playerController.validateSeek(req, res, next);
      }, `Invalid Parameter Validation Function For Seek`);
      req.query.state = wrongRepeat1;
      assert.throws(() => {
        playerController.validateRepeat(req, res, next);
      }, `Invalid Parameter Validation Function For Repeat`);
      req.query.state = wrongRepeat2;
      assert.throws(() => {
        playerController.validateRepeat(req, res, next);
      }, `Invalid Parameter Validation Function For Repeat`);
      req.query.state = wrongRepeat3;
      assert.throws(() => {
        playerController.validateRepeat(req, res, next);
      }, `Invalid Parameter Validation Function For Repeat`);
      req.query.state = wrongShuffle1;
      assert.throws(() => {
        playerController.validateShuffle(req, res, next);
      }, `Invalid Parameter Validation Function For Shuffle`);
      req.query.state = wrongShuffle2;
      assert.throws(() => {
        playerController.validateShuffle(req, res, next);
      }, `Invalid Parameter Validation Function For Shuffle`);
      req.query.state = wrongShuffle3;
      assert.throws(() => {
        playerController.validateShuffle(req, res, next);
      }, `Invalid Parameter Validation Function For Shuffle`);
      req.query.volume_percent = wrongVolume1;
      assert.throws(() => {
        playerController.validateVolume(req, res, next);
      }, `Invalid Parameter Validation Function For Volume`);
      req.query.volume_percent = wrongVolume2;
      assert.throws(() => {
        playerController.validateVolume(req, res, next);
      }, `Invalid Parameter Validation Function For Volume`);
      req.query.volume_percent = wrongVolume3;
      assert.throws(() => {
        playerController.validateVolume(req, res, next);
      }, `Invalid Parameter Validation Function For Volume`);
      req.query.volume_percent = wrongVolume4;
      assert.throws(() => {
        playerController.validateVolume(req, res, next);
      }, `Invalid Parameter Validation Function For Volume`);
      req.query.before = wrongRecentlyPlayed1[0];
      req.query.after = wrongRecentlyPlayed1[1];
      req.query.limit = wrongRecentlyPlayed1[2];
      assert.throws(() => {
        playerController.validateGetRecentlyPlayed(req, res, next);
      }, `Invalid Parameter Validation Function For Recently Played`);
      req.query.before = wrongRecentlyPlayed2[0];
      req.query.after = wrongRecentlyPlayed2[1];
      req.query.limit = wrongRecentlyPlayed2[2];
      assert.throws(() => {
        playerController.validateGetRecentlyPlayed(req, res, next);
      }, `Invalid Parameter Validation Function For Recently Played`);
      req.query.before = wrongRecentlyPlayed3[0];
      req.query.after = wrongRecentlyPlayed3[1];
      req.query.limit = wrongRecentlyPlayed3[2];
      assert.throws(() => {
        playerController.validateGetRecentlyPlayed(req, res, next);
      }, `Invalid Parameter Validation Function For Recently Played`);
      req.query.before = wrongRecentlyPlayed4[0];
      req.query.after = wrongRecentlyPlayed4[1];
      req.query.limit = wrongRecentlyPlayed4[2];
      assert.throws(() => {
        playerController.validateGetRecentlyPlayed(req, res, next);
      }, `Invalid Parameter Validation Function For Recently Played`);
      req.query.before = wrongRecentlyPlayed5[0];
      req.query.after = wrongRecentlyPlayed5[1];
      req.query.limit = wrongRecentlyPlayed5[2];
      assert.throws(() => {
        playerController.validateGetRecentlyPlayed(req, res, next);
      }, `Invalid Parameter Validation Function For Recently Played`);
      req.query.before = wrongRecentlyPlayed6[0];
      req.query.after = wrongRecentlyPlayed6[1];
      req.query.limit = wrongRecentlyPlayed6[2];
      assert.throws(() => {
        playerController.validateGetRecentlyPlayed(req, res, next);
      }, `Invalid Parameter Validation Function For Recently Played`);
    });

    it('Should not throw any errors for valid query paramters.', function() {
      const req = { query: {} };
      const next = err => {
        if (err) throw err;
      };
      const res = {};
      req.query.position_ms = correctPosition;
      assert.doesNotThrow(() => {
        playerController.validateSeek(req, res, next);
      }, 'An error is thrown for valid input position_ms');

      req.query.state = correctRepeat;
      assert.doesNotThrow(() => {
        playerController.validateRepeat(req, res, next);
      }, `An error is thrown for valid input repeat state`);

      req.query.state = correctShuffle;
      assert.doesNotThrow(() => {
        playerController.validateShuffle(req, res, next);
      }, `An error is thrown for valid input shuffle state`);

      req.query.volume_percent = correctVolume;
      assert.doesNotThrow(() => {
        playerController.validateVolume(req, res, next);
      }, `An error is thrown for valid input volume_percent`);

      req.query.before = correctRecentlyPlayed[0];
      req.query.after = correctRecentlyPlayed[1];
      req.query.limit = correctRecentlyPlayed[2];
      assert.doesNotThrow(() => {
        playerController.validateGetRecentlyPlayed(req, res, next);
      }, `An error is thrown for valid inputs before, after and limit`);
    });
  });
});

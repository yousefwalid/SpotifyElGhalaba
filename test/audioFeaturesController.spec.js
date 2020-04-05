const assert = require('assert');
const AudioFeatures = require('./../models/audioFeaturesModel');
const Track = require('./../models/trackModel');
const Album = require('./../models/albumModel');
const User = require('./../models/userModel');
const audioFeaturesController = require('./../controllers/audioFeaturesController');
const generateArtist = require('./utils/insertArtistIntoDB');
const generateTrack = require('./utils/generateTrack');
const generateAlbum = require('./utils/generateAlbum');

const { dropDB } = require('./dropDB');

describe('Testing Audio-Features controller', function() {
  this.timeout(10000);
  let user;
  let generatedAlbum;
  let createdAlbum;
  this.beforeAll(async function() {
    await dropDB();
  });
  this.beforeEach(async function() {
    user = await generateArtist();
    generatedAlbum = generateAlbum(user._id);
  });
  it('Testing add audio features for a track', async function() {
    createdAlbum = await Album.create(generatedAlbum);
    const generatedTrack = generateTrack(createdAlbum._id, user.id);
    const createdTrack = await Track.create(generatedTrack);
    assert.doesNotReject(async () => {
      await audioFeaturesController.addAudioFeaturesForTrackLogic({
        danceability: 0.735,
        energy: 0.578,
        key: 5,
        loudness: -11.84,
        mode: 0,
        speechiness: 0.0461,
        acousticness: 0.514,
        instrumentalness: 0.0902,
        liveness: 0.159,
        valence: 0.624,
        tempo: 98.002,
        type: 'audio_features',
        track: createdTrack._id,
        duration_ms: 255349,
        time_signature: 4
      });
    });
  });
  it('Testing add audio features for a track with invalid ID', async function() {
    try {
      await audioFeaturesController.addAudioFeaturesForTrackLogic({
        danceability: 0.735,
        energy: 0.578,
        key: 5,
        loudness: -11.84,
        mode: 0,
        speechiness: 0.0461,
        acousticness: 0.514,
        instrumentalness: 0.0902,
        liveness: 0.159,
        valence: 0.624,
        tempo: 98.002,
        type: 'audio_features',
        track: '5e6fc15414584539a85da381',
        duration_ms: 255349,
        time_signature: 4
      });
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing get audio features for a track', async function() {
    createdAlbum = await Album.create(generatedAlbum);
    const generatedTrack = generateTrack(createdAlbum._id, user.id);
    const createdTrack = await Track.create(generatedTrack);
    const manualAudioFeatures = await AudioFeatures.create({
      danceability: 0.735,
      energy: 0.578,
      key: 5,
      loudness: -11.84,
      mode: 0,
      speechiness: 0.0461,
      acousticness: 0.514,
      instrumentalness: 0.0902,
      liveness: 0.159,
      valence: 0.624,
      tempo: 98.002,
      type: 'audio_features',
      track: createdTrack._id,
      duration_ms: 255349,
      time_signature: 4
    });
    const returnedObject = await audioFeaturesController.getAudioFeaturesForTrackLogic(
      createdTrack._id
    );
    assert.deepStrictEqual(
      returnedObject.toObject(),
      manualAudioFeatures.toObject()
    );
  });
  it('Testing get audio features for a track with invalid ID', async function() {
    try {
      await audioFeaturesController.getAudioFeaturesForTrackLogic(
        '5e6fc15414584539a85da381'
      );
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
  it('Testing get audio features for several tracks', async function() {
    createdAlbum = await Album.create(generatedAlbum);
    const generatedTracks = [];
    const TracksIDs = [];
    for (let i = 0; i < 20; i++) {
      generatedTracks.push(generateTrack(createdAlbum._id, user.id));
    }
    const createdTracks = await Track.create(generatedTracks);
    for (let i = 0; i < 20; i++) {
      TracksIDs.push(createdTracks[i]._id);
    }
    const audioFeaturesObjects = [];
    for (let i = 0; i < 20; i++) {
      audioFeaturesObjects.push({
        danceability: 0.735,
        energy: 0.578,
        key: 5,
        loudness: -11.84,
        mode: 0,
        speechiness: 0.0461,
        acousticness: 0.514,
        instrumentalness: 0.0902,
        liveness: 0.159,
        valence: 0.624,
        tempo: 98.002,
        type: 'audio_features',
        track: createdTracks[i]._id,
        duration_ms: 255349,
        time_signature: 4
      });
    }
    const audioFeaturesDocs = await AudioFeatures.create(audioFeaturesObjects);
    const returnedAudioFeatures = await audioFeaturesController.getAudioFeaturesForSeveralTracksLogic(
      TracksIDs
    );
    let i = 0;
    returnedAudioFeatures.forEach(el => {
      assert.deepStrictEqual(audioFeaturesDocs[i].toObject(), el.toObject());
      i++;
    });
    assert.strictEqual(returnedAudioFeatures.length, 20);
  });
  it('Testing get audio features for several tracks with some invalid IDs', async function() {
    const returnedAudioFeatures = await audioFeaturesController.getAudioFeaturesForSeveralTracksLogic(
      ['5e6fc15414584539a85da381', '5e6fc15414584539a85da381']
    );
    returnedAudioFeatures.forEach(el => {
      assert.strictEqual(el, null);
    });
  });
});

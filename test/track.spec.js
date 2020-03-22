const app = require('./../app');
const assert = require('assert');
const supertest = require('supertest')('http://localhost:3000/');
const dotenv = require('dotenv');

dotenv.config({
  path: './config.env'
});

describe('Testing tracks controller', function() {
  it('testing get track', function(done) {
    supertest
      .get('api/v1/tracks/5e6fe1929675d13810e546e6')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        const response = JSON.parse(res.text);
        if (
          !('artists',
          'disc_number',
          'name',
          'album',
          'duration_ms',
          'explicit',
          'is_playable',
          'track_number',
          'type',
          'uri',
          'href',
          'id' in response)
        ) {
          return done('response is missing keys');
        }
        done();
      });
  });
  it('testing get track with false id', function(done) {
    supertest
      .get('api/v1/tracks/5e66a8df1938e22eb0cd3e93')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .expect(404)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
  it('testing get track with wrong mongo id', function(done) {
    supertest
      .get('api/v1/tracks/123')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .expect(500)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
  it('testing get several tracks', function(done) {
    supertest
      .get(
        'api/v1/tracks?ids=5e66a8df1938e22eb0cd3e93,5e6fe1929675d13810e546e6'
      )
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        const response = JSON.parse(res.text);
        if (!response.Tracks) return done('No tracks array in the response');
        if (!Array.isArray(response.Tracks))
          return done('Tracks is not an array of tracks');
        if (!response.Tracks[0] == null)
          return done('first item should be null as the id does not exist');
        done();
      });
  });
  it('testing get Audio features for a track', function(done) {
    supertest
      .get('api/v1/audio-features/5e6fc15414584539a85da381')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
  it('testing get Audio features for non existing track', function(done) {
    supertest
      .get('api/v1/audio-features/5e6fc15414584539a85da582')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .expect(404)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
  it('testing get Audio features for several tracks', function(done) {
    supertest
      .get(
        'api/v1/audio-features?ids=5e6fc15414584539a85da582,5e6fc15414584539a85da581'
      )
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        const response = JSON.parse(res.text);
        if (response.audioFeatures[0] != null)
          return done('first element should be null');
        done();
      });
  });
  it('testing adding audiofeatures ', function(done) {
    supertest
      .post('api/v1/audio-features')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .send({
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
        track: '5e66a8df1938e22eb0cd3e9e',
        duration_ms: 255349,
        time_signature: 4
      })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
  it('testing adding audiofeatures to non existing track ', function(done) {
    supertest
      .post('api/v1/audio-features')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .send({
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
        track: '5e66a8df1938e22eb0cd3e91',
        duration_ms: 255349,
        time_signature: 4
      })
      .expect(404)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
  it('testing adding a track ', function(done) {
    supertest
      .post('api/v1/tracks')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .send({
        name: 'tested Track',
        album: '5e6b921a1229f9354cef69dc',
        disc_number: 1,
        duration_ms: 5000,
        explicit: false,
        is_playable: true
      })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
  it('testing adding a track with invalid album id ', function(done) {
    supertest
      .post('api/v1/tracks')
      .set('Authorization', `Bearer ${process.env.TOKEN}`)
      .send({
        name: 'failed tested Track',
        album: '5e6b921a1229f9354cef69d1',
        disc_number: 1,
        duration_ms: 5000,
        explicit: false,
        is_playable: true
      })
      .expect(404)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});

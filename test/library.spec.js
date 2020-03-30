// const app = require('./../app');
// const assert = require('assert');
// const supertest = require('supertest')('http://localhost:3000/');
// const dotenv = require('dotenv');

// dotenv.config({
//   path: './config.env'
// });

// describe('Testing library controller', function() {
//   it('testing save track', function(done) {
//     supertest
//       .put('api/v1/me/tracks?ids=5e73ef29ba10840a585489d5')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(201)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing save track with invalid id', function(done) {
//     supertest
//       .put('api/v1/me/tracks?ids=5e73ef29ba10840a585489de')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(404)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing save track with no ids', function(done) {
//     supertest
//       .put('api/v1/me/tracks')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(400)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing save album', function(done) {
//     supertest
//       .put('api/v1/me/albums?ids=5e74e4041fe6aa1adc9371ef')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(201)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing save album with invalid id', function(done) {
//     supertest
//       .put('api/v1/me/albums?ids=5e74e4041fe6aa1adc9371ee')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(404)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing save album with no ids', function(done) {
//     supertest
//       .put('api/v1/me/albums')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(400)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing remove saved album', function(done) {
//     supertest
//       .delete('api/v1/me/albums?ids=5e74e4041fe6aa1adc9371ef')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing remove saved track', function(done) {
//     supertest
//       .delete('api/v1/me/tracks?ids=5e73ef29ba10840a585489d5')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing check saved tracks with valid and invalid track', function(done) {
//     supertest
//       .get(
//         'api/v1/me/tracks/contains?ids=5e6fe1929675d13810e546e6,5e6fe1929675d13810e546e4'
//       )
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         const response = JSON.parse(res.text);
//         if (response[0] !== true || response[1] !== false)
//           return done('data returned false');
//         done();
//       });
//   });
//   it('testing check saved albums with valid and invalid albums', function(done) {
//     supertest
//       .get(
//         'api/v1/me/albums/contains?ids=5e66a93e4c64aa1ef03384d0,5e66a93e4c64aa1ef03384d1'
//       )
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         const response = JSON.parse(res.text);
//         if (response[0] !== true || response[1] !== false)
//           return done('data returned false');
//         done();
//       });
//   });
//   it('testing get users saved albums', function(done) {
//     supertest
//       .get('api/v1/me/albums')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         const response = JSON.parse(res.text);
//         if (!('album', 'added_at', 'id' in response.items[1])) {
//           return done('response is missing keys');
//         }
//         done();
//       });
//   });
//   it('testing get users saved tracks', function(done) {
//     supertest
//       .get('api/v1/me/tracks')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         const response = JSON.parse(res.text);
//         if (!('track', 'added_at', 'id' in response.items[1])) {
//           return done('response is missing keys');
//         }
//         done();
//       });
//   });
// });
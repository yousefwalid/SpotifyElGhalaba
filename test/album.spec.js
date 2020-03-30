// const app = require('./../app');
// const assert = require('assert');
// const supertest = require('supertest')('http://localhost:3000/');
// const dotenv = require('dotenv');

// dotenv.config({
//   path: './config.env'
// });

// describe('Testing Albums controller', function() {
//   it('testing get Album', function(done) {
//     supertest
//       .get('api/v1/albums/5e66a93e4c64aa1ef03384d0')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         const response = JSON.parse(res.text);
//         if (
//           !('artists',
//           'genres',
//           'tracks',
//           'album_type',
//           'name',
//           'popularity',
//           'release_date',
//           'images',
//           'type',
//           'uri',
//           'href',
//           'id' in response)
//         ) {
//           return done('response is missing keys');
//         }
//         done();
//       });
//   });
//   it('testing get album with false id', function(done) {
//     supertest
//       .get('api/v1/albums/5e66a8df1938e22eb0cd3e93')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(404)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing get album with wrong mongo id', function(done) {
//     supertest
//       .get('api/v1/albums/123')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(500)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing get album tracks', function(done) {
//     supertest
//       .get('api/v1/albums/5e66a93e4c64aa1ef03384d0/tracks')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         const response = JSON.parse(res.text);
//         if (response.items.length !== 20)
//           return done('Response contains more than default limit');
//         done();
//       });
//   });
//   it('testing get album tracks with invalid id', function(done) {
//     supertest
//       .get('api/v1/albums/5e66a93e4c64aa1ef03384d2/tracks')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(404)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
//   it('testing get several albums', function(done) {
//     supertest
//       .get(
//         'api/v1/albums?ids=5e66a93e4c64aa1ef03384d3,5e66a93e4c64aa1ef03384d2'
//       )
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         const response = JSON.parse(res.text);
//         if (!response.Albums) return done('No albums array in the response');
//         if (!Array.isArray(response.Albums))
//           return done('Albums is not an array of Albums');
//         if (!response.Albums[0] == null)
//           return done('first item should be null as the id does not exist');
//         done();
//       });
//   });
//   it('testing adding an album ', function(done) {
//     supertest
//       .post('api/v1/albums')
//       .set('Authorization', `Bearer ${process.env.TOKEN}`)
//       .send({
//         album_type: 'album',
//         genres: ['Rock', 'jazz'],
//         Label: 'testalbum',
//         name: 'TestAlbum'
//       })
//       .expect(201)
//       .end(function(err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });
// });
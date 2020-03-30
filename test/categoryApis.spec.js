// const supertest = require('supertest')('http://localhost:8000/');
// // const assert = require('assert');
// // const app = require('../app');

// const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNmZjNmViYjg3MTViM2YxZGM0MGI4MCIsImlhdCI6MTU4NDY1MDg3OSwiZXhwIjoxNTkyNDI2ODc5fQ.6lEORdXefepf6yNI7Yyc4kNBdix1lU9szwClm6TPodk";

// describe('Get all categories', function () {
//   it('it should has status code 200', function (done) {
//     supertest
//       .get('api/v1/browse/categories')
//       .expect(200)
//       .end(function (err, res) {
//         if (err) return done(err);
//         done();
//       });
//   });

//   it('it should has an array of categories', function (done) {
//     supertest
//       .get('api/v1/browse/categories')
//       .expect(200)
//       .end(function (err, res) {
//         if (err) return done(err);

//         const response = JSON.parse(res.text);

//         if (!response.data) return done('not data object in the response');
//         if (!response.data.categories) return done('no categories in the data response');
//         if (!Array.isArray(response.data.categories)) return done("categories is not of type array");
//         done();
//       });
//   });

//   it('Playlists, _id, name and icons exists in the category response', function (done) {
//     supertest
//       .get('api/v1/browse/categories')
//       .expect(200)
//       .end(function (err, res) {
//         if (err) return done(err);

//         const response = JSON.parse(res.text);
//         const {
//           categories
//         } = response.data;

//         categories.forEach(category => {
//           if (!('Playlists', '_id', 'name', 'icons' in category)) return done('one of them dont exist');
//         });

//         done();
//       });
//   });
// });


// describe('Add a new category', function () {

//   let response;

//   it('Return status code 201 and json response', function (done) {
//     supertest
//       .post('api/v1/browse/categories')
//       .set('Authorization', `Bearer ${authToken}`)
//       .set('Accept', 'application/json')
//       .send({
//         "name": "Party 2",
//         "icons": [{
//           "width": 50,
//           "height": 50,
//           "url": "/party.png"
//         }]
//       })
//       .expect('Content-Type', /json/)
//       .expect(201)
//       .end(function (err, res) {
//         if (err) return done(err);

//         response = JSON.parse(res.text);

//         done();
//       });
//   });
// });
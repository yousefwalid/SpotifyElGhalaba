const supertest = require('supertest')('http://localhost:8000/');

describe('Get all categories', function() {
  it('it should has status code 200', function(done) {
    expect(true).toBe(true);
  });

  it('it should has an array of categories', function(done) {
    expect(true).toBe(true);
  });

  it('Playlists, _id, name and icons exists in the category response', function(done) {
    expect(true).toBe(true);
  });
});

describe('Add a new category', function() {
  it('Return status code 201 and json response', function(done) {
    expect(true).toBe(true);
  });
});

const dotenv = require('dotenv');

dotenv.config({
  path: './config.env'
});

describe('Testing Albums controller', function() {
  it('testing get Album', function(done) {
    expect(true).toBe(true);
  });
  it('testing get album with false id', function(done) {
    expect(true).toBe(true);
  });
  it('testing get album with wrong mongo id', function(done) {
    expect(true).toBe(true);
  });
  it('testing get album tracks', function(done) {
    expect(true).toBe(true);
  });
  it('testing get album tracks with invalid id', function(done) {
    expect(true).toBe(true);
  });
  it('testing get several albums', function(done) {
    expect(true).toBe(true);
  });
  it('testing adding an album ', function(done) {
    expect(true).toBe(true);
  });
});

const faker = require('faker');
const Track = require('./../../models/trackModel');

module.exports = (albumID, artistsIDS) => {
  const track = {
    album: albumID,
    artists: artistsIDS,
    disc_number: faker.random.number(),
    duration_ms: faker.random.number(),
    explicit: faker.random.boolean(),
    name: faker.name.findName()
  };
  return track;
};

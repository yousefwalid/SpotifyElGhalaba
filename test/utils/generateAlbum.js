const faker = require('faker');
const Album = require('./../../models/albumModel');

module.exports = artistID => {
  const album = {
    album_type: 'album',
    artists: artistID,
    genres: ['Rock', 'Jazz'],
    label: faker.random.words(),
    name: faker.name.findName(),
    release_date: new Date(),
    tracks: []
  };
  return album;
};

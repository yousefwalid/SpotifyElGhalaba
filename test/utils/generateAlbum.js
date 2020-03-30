const faker = require('faker');
const Album = require('./../../models/albumModel');
const mongoose = require('mongoose');
exports.generateAlbum = async (artistID, tracksIDs) => {
  const album = {
    album_type: 'Album',
    artists: artistID,
    genres: ['Rock,Jazz'],
    label: faker.random.words(),
    name: faker.name.findName(),
    release_date: new Date(),
    tracks: []
  };
  return album;
};

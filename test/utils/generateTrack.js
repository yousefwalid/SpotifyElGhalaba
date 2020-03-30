const faker = require('faker');
const Track = require('./../../models/trackModel');
const mongoose = require('mongoose');

exports.generateTrack = (albumID, artistsIDS) => {
  const track = {
    album: albumID,
    artist: artistsIDS,
    disc_number: faker.random.number(),
    duration_ms: faker.random.number(),
    explicit: faker.random.boolean(),
    name: faker.name.findName()
  };
  return track;
};

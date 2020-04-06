const faker = require('faker');
const { ObjectId } = require('mongoose').Types;

const randomizeNumber = require('./../utils/randomizeNumber');

exports.categoryObjects = givenPlaylists => {
  const categoryObjects = [];

  for (let i = 0; i < 20; i += 1) {
    const playlistCount = randomizeNumber(5, 10);
    const playlistIndexes = randomizeNumber(
      0,
      givenPlaylists.length - 1,
      playlistCount,
      true
    );
    const playlists = playlistIndexes.map(el => ObjectId(playlists[el]));
    const name = faker.name.firstName();

    categoryObjects.push({
      name,
      playlists
    });
  }
  return categoryObjects;
};

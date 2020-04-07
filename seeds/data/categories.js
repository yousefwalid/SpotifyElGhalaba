const faker = require('faker');
const { ObjectId } = require('mongoose').Types;

const randomizeNumber = require('./../utils/randomizeNumber');

exports.categoryObjects = givenPlaylists => {
  const categoryObjects = [];

  for (let i = 0; i < 20; i += 1) {
    const playlistCount = randomizeNumber(1, 4);
    const playlistIndexes = randomizeNumber(
      0,
      givenPlaylists.length - 1,
      playlistCount % (givenPlaylists.length - 1),
      true
    );

    const playlists = playlistIndexes.map(
      el => new ObjectId(givenPlaylists[el])
    );
    const name = faker.name.firstName();

    categoryObjects.push({
      name,
      playlists
    });
  }
  return categoryObjects;
};

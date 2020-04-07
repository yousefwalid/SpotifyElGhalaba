const faker = require('faker');

const randomizeNumber = require('./../utils/randomizeNumber');

module.exports = (userIds, tracksIds) => {
  const usersCount = userIds.length;
  const tracksLength = tracksIds.length;

  const playlistObjects = [];

  for (let i = 0; i < 3; i += 1) {
    const playlistObject = {
      name: faker.lorem.word(),
      owner: userIds[(i + 2) % usersCount],
      description: faker.lorem.sentence(),
      public: true
    };

    playlistObjects.push(playlistObject);
  }

  for (let i = 0; i < 3; i += 1) {
    const playlistObject = {
      name: faker.lorem.word(),
      owner: userIds[i % usersCount],
      description: faker.lorem.sentence(),
      public: false
    };

    playlistObjects.push(playlistObject);
  }

  playlistObjects.forEach(playlist => {
    const playlistTrackObjs = [];

    const randomNum = randomizeNumber(0, tracksLength - 1);
    for (let i = 0; i < randomNum; i += 1) {
      const randomTrackNum = randomizeNumber(0, tracksLength - 1);

      const playlistTrackObj = {
        added_at: Date.now(),
        added_by: playlist.owner,
        is_local: false,
        track: tracksIds[randomTrackNum % tracksLength]
      };

      playlistTrackObjs.push(playlistTrackObj);
    }

    playlist.tracks = { items: playlistTrackObjs };
  });

  return playlistObjects;
};

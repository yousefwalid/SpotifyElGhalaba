const faker = require('faker');

const randomizeNumber = require('./../utils/randomizeNumber');

exports.albumObjects = artistIds => {
  const albumObjects = [];

  const albumTypes = ['album', 'single', 'compilation'];
  const Availablegenres = [
    'rock',
    'metal',
    'pop',
    'country',
    'oriental',
    'folk',
    'electronic',
    'rap'
  ];

  for (let i = 0; i < 20; i += 1) {
    const albumTypeIndex = randomizeNumber(0, 2);
    // eslint-disable-next-line camelcase
    const album_type = albumTypes[albumTypeIndex];

    const artistsCount = randomizeNumber(1, 2);
    const artistsIndexes = randomizeNumber(
      0,
      artistIds.length - 1,
      artistsCount,
      true
    );
    const artists = artistsIndexes.map(el => artistIds[el]);

    const name = faker.name.firstName();

    // const popularity = randomizeNumber(0, 100);

    // eslint-disable-next-line camelcase
    const release_date = faker.date.past(20);

    const genresCount = randomizeNumber(1, 3);
    const genresIndexes = randomizeNumber(
      0,
      Availablegenres.length - 1,
      genresCount,
      true
    );
    const genres = genresIndexes.map(el => Availablegenres[el]);

    albumObjects.push({
      name,
      release_date,
      album_type,
      genres,
      artists
    });
  }
  return albumObjects;
};

exports.setAlbumTracks = () => {};

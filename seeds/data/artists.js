module.exports = function(userIds) {
  const genres = [
    'rock',
    'metal',
    'pop',
    'country',
    'oriental',
    'folk',
    'electronic',
    'rap'
  ];

  const artistObjects = [];

  userIds.forEach(userId => {
    const artistGenres = [];

    let randomNum = Math.floor(Math.random() * 50) % 8;
    let randomNum2 = Math.floor(Math.random() * 50) % 4;

    if (randomNum2 == 0) randomNum2 = 1;

    artistGenres.push(genres[randomNum]);
    artistGenres.push(genres[(randomNum + randomNum2) % 8]);

    const artistObject = {
      genres: artistGenres,
      userInfo: userId
    };

    artistObjects.push(artistObject);
  });

  return artistObjects;
};

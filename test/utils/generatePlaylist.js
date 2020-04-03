const faker = require('faker');

/**
 * Creates a playlist object and returns it
 * @param {String} ownerId the owner's id
 * @param {Array<String>} tracks array of the tracks to be inserted
 * @return {playlistObject}
 */
module.exports = (ownerId, tracks) => {
  const playlist = {
    name: faker.lorem.word(),
    owner: ownerId,
    collaborative: false,
    public: true,
    description: faker.lorem.words()
  };

  const items = [];

  if (tracks) {
    tracks.forEach(track => {
      const playlistTrack = {
        added_at: Date.now(),
        added_by: ownerId,
        is_local: false,
        track: track
      };

      items.push(playlistTrack);
    });

    playlist['tracks.items'] = items;
  }

  return playlist;
};

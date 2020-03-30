const faker = require('faker');

exports.generatePlaylist = (userId, tracks) => {
  const playlist = {
    name: faker.fake.name(),
    owner: userId,
    collaborative: false,
    public: true,
    description: faker.lorem.words()
  };

  const items = [];

  if (tracks)
    tracks.forEach(track => {
      const playlistTrack = {
        added_at: Date.now(),
        added_by: userId,
        is_local: false,
        track: track
      };

      items.push(playlistTrack);
    });

  playlist.tracks.items = items;

  return playlist;
};

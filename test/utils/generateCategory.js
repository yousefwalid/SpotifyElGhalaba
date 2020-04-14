const faker = require('faker');
const generatePlaylist = require('./generatePlaylist');
const Playlist = require('../../models/playlistModel');
/**
 * Creates a category body and return it
 * @return {category}
 */
module.exports = async () => {
    const playlist1 = await Playlist.create(generatePlaylist());
    const playlist2 = await Playlist.create(generatePlaylist());

    const category = {
        name: faker.lorem.word(),
        icons: [{
            width: 50,
            height: 50,
            url: `/${faker.lorem.word()}.png`
        }],
        playlists: [playlist1.id, playlist2.id]
    };

    return category;
};
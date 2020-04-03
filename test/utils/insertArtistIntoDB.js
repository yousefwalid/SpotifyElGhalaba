const generateUser = require('./createUser');
const User = require('../../models/userModel');
const Artist = require('../../models/artistModel');

module.exports = async () => {
  const user = generateUser('artist');
  const insertedUser = await User.create(user);

  const artistBody = {
    userInfo: insertedUser._id
  };

  const insertedArtist = await Artist.create(artistBody);

  insertedArtist.userInfo = insertedUser;

  return insertedArtist;
};

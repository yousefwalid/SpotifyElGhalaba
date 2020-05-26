const sendNotification = require('./../utils/sendNotification');
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');

exports.sendNewTrackNotification = async track => {
  const artists = await Artist.find({ _id: { $in: track.artists } });

  const artistName = artists[0].name;

  const userIds = artists.map(el => el.userInfo._id);

  const followingUsersIds = (
    await User.find({ following: { $in: userIds } }).select('id')
  ).map(el => el._id);

  sendNotification(
    followingUsersIds,
    `An artist you follow has just posted a new track!`,
    `${artistName} has just posted a new track: ${track.name}`
  );
};

const sendNotification = require('./../utils/sendNotification');
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');

exports.sendNewTrackNotification = async track => {
  const artists = await Artist.find({ _id: { $in: track.artists } });

  const artistName = artists[0].toObject().name;

  const userIds = artists.map(el => el.userInfo._id);

  const followingUsersIds = (
    await User.find({
      following: { $in: userIds },
      'enabledNotifications.newArtistTrack': 1
    }).select('id')
  ).map(el => el._id);

  await sendNotification(
    followingUsersIds,
    `An artist you follow has just posted a new track! 🎵`,
    `${artistName} has just posted the new track: ${track.name}`,
    { id: track.id }
  );
};

exports.sendNewAlbumNotification = async album => {
  const artists = await Artist.find({ _id: { $in: album.artists } });

  const artistName = artists[0].toObject().name;

  const userIds = artists.map(el => el.userInfo._id);

  const followingUsersIds = (
    await User.find({
      following: { $in: userIds },
      'enabledNotifications.newArtistAlbum': 1
    }).select('id')
  ).map(el => el._id);

  await sendNotification(
    followingUsersIds,
    `An artist you follow has just posted a new album! 🎶`,
    `${artistName} has just posted the new album: ${album.name}`,
    { id: album.id }
  );
};

exports.sendFollowPlaylistNotification = async (playlist, user) => {
  const owner = await User.findById(playlist.owner);

  if (owner.enabledNotifications.playlistFollowed != 1) return;

  await sendNotification(
    playlist.owner,
    `Your playlist has a new follower!🎉`,
    `${user.name} has followed your playlist: ${playlist.name} 🔥`,
    {
      id: playlist._id
    }
  );
};

exports.sendFollowUserNotification = async (
  followingUser,
  followedUsersIds
) => {
  const users = (
    await User.find({
      _id: { $in: followedUsersIds },
      'enabledNotifications.userFollowed': 1
    }).select('_id enabledNotifications')
  ).map(el => el._id);

  await sendNotification(
    users,
    `You have a new follower! 👨🏼‍🤝‍👨🏻`,
    `${followingUser.name} has followed you 💕`,
    {
      id: followingUser._id
    }
  );
};

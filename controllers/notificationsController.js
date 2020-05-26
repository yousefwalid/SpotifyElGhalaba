const sendNotification = require('./../utils/sendNotification');
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');

const getFollowersOfArtist = async artistsIds => {
  const artists = await Artist.find({ _id: { $in: artistsIds } });

  const artistName = artists[0].toObject().name;

  const userIds = artists.map(el => el.userInfo._id);

  const followingUsersIds = (
    await User.find({ following: { $in: userIds } }).select('id')
  ).map(el => el._id);

  return { followingUsersIds, artistName };
};

exports.sendNewTrackNotification = async track => {
  const { followingUsersIds, artistName } = await getFollowersOfArtist(
    track.artists
  );

  await sendNotification(
    followingUsersIds,
    `An artist you follow has just posted a new track! 🎵`,
    `${artistName} has just posted the new track: ${track.name}`,
    { id: track.id }
  );
};

exports.sendNewAlbumNotification = async album => {
  const { followingUsersIds, artistName } = await getFollowersOfArtist(
    album.artists
  );

  await sendNotification(
    followingUsersIds,
    `An artist you follow has just posted a new album! 🎶`,
    `${artistName} has just posted the new album: ${album.name}`,
    { id: album.id }
  );
};

exports.sendFollowPlaylistNotification = async (playlist, user) => {
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
  await sendNotification(
    followedUsersIds,
    `You have a new follower! 👨🏼‍🤝‍👨🏻`,
    `${followingUser.name} has followed you 💕`,
    {
      id: followingUser._id
    }
  );
};

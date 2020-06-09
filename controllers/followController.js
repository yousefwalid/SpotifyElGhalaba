/**
 * Category Controller
 * @module followController
 */
const mongoose = require('mongoose');
const User = require('./../models/userModel');
const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');
const notificationsController = require('./notificationsController');

/**
 * A method that takes user id and an array of user ids to be followed by this user
 * @param {String} userId - The id of the user who is going to follow the other ids
 * @param {Array} idsToFollow - The ids to be followed by this user id
 * @param {String} [type] - ( Optional )Follow only the ids with the specific type ex: "artist"
 * @returns {void}
 */
const follow = async (userId, idsToFollow, type) => {
  const me = await User.findById(userId);
  if (idsToFollow.includes(me.id)) throw new AppError("You can't follow yourself!");

  // check if the ids are valid ids
  let validIdsToFollow = await User.find({
    "_id": {
      $in: idsToFollow
    }
  });
  validIdsToFollow = validIdsToFollow.map(user => user._id.toString());

  if (!validIdsToFollow.length) throw new AppError("Please enter valid ids to follow");

  idsToFollow.forEach(idToFollow => {
    if (!validIdsToFollow.includes(idToFollow)) throw new AppError("Please enter valid ids to follow");
  });



  // the already followed ids
  const following = me.following.map(id => id.toString());

  // get the distinct ids only
  idsToFollow = idsToFollow.filter(id => !following.includes(id));

  if (type)
    idsToFollow = (
      await User.find({
        _id: {
          $in: idsToFollow
        },
        type: type
      })
    ).map(user => user._id.toString());


  // adding new ids to be followed to the user
  idsToFollow.forEach(id => {
    me.following.push(id);
  });

  // saving the current user
  await me.save();

  // updating followers counter of the followed users
  await User.updateMany({
    _id: {
      $in: idsToFollow
    }
  }, {
    $inc: {
      followers: 1
    }
  });

  if (idsToFollow)
    await notificationsController.sendFollowUserNotification(me, idsToFollow);
};
exports.followLogic = follow;

/**
 * A method that takes a user id and an array of ids to check if the user  follow them or not.
 * @param {String} userId - The id of the user to check his followers
 * @param {Array} idsToBeChecked - Ids of the user to check if the current user follows
 * @param {String} [type] - ( Optional ) To filter the ids to specific account type
 * @returns {Array} - Comma separated boolean values in the same order in which the idsToBeChecked were specified.
 */
const checkFollowing = async (userId, idsToBeChecked, type) => {
  const me = await User.findById(userId);

  // the already followed ids
  const following = me.following.map(id => id.toString());

  let idsToBeCheckedFiltered = idsToBeChecked;

  if (type)
    idsToBeCheckedFiltered = (
      await User.find({
        _id: {
          $in: idsToBeChecked
        },
        type: type
      })
    ).map(user => user._id.toString());

  const response = idsToBeChecked.map(
    id => following.includes(id) && idsToBeCheckedFiltered.includes(id)
  );

  return response;
};
exports.checkFollowingLogic = checkFollowing;
/**
 * A method that takes a user id and return array of the followed users
 * @param {String} userId - The id of the user to get his followers
 * @param {Object} [queryParams] - (Optional) Any aditional parameters to limit the response ex: type=artist to get the artists only or limit=20 to limit the returned values to 20 only
 * @returns {Array} Array of the users followed by the given id
 */
const getFollowedUsers = async (userId, queryParams) => {
  if (!queryParams) queryParams = {};

  //get an array of the followed ids
  const {
    following: followedIds
  } = await User.findById(userId);

  // construct the query to get the users with those ids
  const query = {
    _id: {
      $in: followedIds
    }
  };

  // filter the query if specific user type is required
  if (queryParams.type) query.type = queryParams.type;

  const features = new ApiFeatures(User.find(query), queryParams).skip();

  return await features.query;
};
exports.getFollowedUsersLogic = getFollowedUsers;

const getFollowingUser = async (userId, limit, offset) => {
  limit = limit * 1 || 20;
  offset = offset * 1 || 0;

  if (limit > 50 || limit < 0)
    throw new AppError(400, 'Limit out of range, max: 50, min: 0');

  if (offset > 100000 || offset < 0)
    throw new AppError(400, 'Offset out of range, max: 100,000, min: 0');

  if (!userId) throw new AppError(400, 'User Id not specified');

  userId = mongoose.Types.ObjectId(userId);

  const followingUsersId = (await User.findById(userId).select('following'))
    .following;

  const users = await User.find({
      _id: {
        $in: followingUsersId
      }
    })
    .select('type active followers name email gender country image')
    .limit(limit)
    .skip(offset);

  return users;
};

const getFollowersUser = async (userId, limit, offset) => {
  limit = limit * 1 || 20;
  offset = offset * 1 || 0;

  if (limit > 50 || limit < 0)
    throw new AppError(400, 'Limit out of range, max: 50, min: 0');

  if (offset > 100000 || offset < 0)
    throw new AppError(400, 'Offset out of range, max: 100,000, min: 0');

  if (!userId) throw new AppError(400, 'User Id not specified');

  userId = mongoose.Types.ObjectId(userId);

  const users = await User.aggregate([{
      $match: {
        following: {
          $in: [userId]
        }
      }
    },
    {
      $project: {
        type: '$type',
        active: '$active',
        followers: '$followers',
        name: '$name',
        email: '$email',
        gender: '$gender',
        country: '$country',
        image: '$image'
      }
    },
    {
      $skip: offset
    },
    {
      $limit: limit
    }
  ]);

  return users;
};

/**
 * A method that takes an id of the user and an array of ids to be unfollowed by this user
 * @param {String} userId - user id who wants to unfollow other users
 * @param {Array} idsToUnfollow - Array of ids to be unfollowed by the given user
 * @param {String} [type] - (Optional) To limit the unfollowing process, ex: unfollow artists only or normal users only
 * @returns {void}
 */
const unfollowUsers = async (userId, idsToUnfollow, type) => {
  const me = await User.findById(userId);
  const following = me.following.map(id => id.toString());

  idsToUnfollow = idsToUnfollow.filter(idToUnfollow =>
    following.includes(idToUnfollow)
  );

  if (type)
    idsToUnfollow = (
      await User.find({
        _id: {
          $in: idsToUnfollow
        },
        type: type
      })
    ).map(user => user._id.toString());

  me.following = following.filter(id => !idsToUnfollow.includes(id));
  await me.save();

  await User.updateMany({
    _id: {
      $in: idsToUnfollow
    }
  }, {
    $inc: {
      followers: -1
    }
  });
};

exports.unfollowUsersLogic = unfollowUsers;

/**
 * A method to follow a playlist given the user id and the playlist id
 * @param {String} userId - The id of the user who is going to follow a playlist
 * @param {String} playlistId - The id of the playlist to be followed
 * @param {Boolean} isPublic - Boolean to determine whether you are following the playlist publicly or not
 * @returns {void}
 */
const followPlaylist = async (userId, playlistId, isPublic) => {
  const me = await User.findById(userId);

  const followedPlaylists = me.followedPlaylists.map(followedPlaylist =>
    followedPlaylist.playlist.toString()
  );

  // id of the new playlist
  const playlistToFollow = playlistId;

  if (followedPlaylists.includes(playlistToFollow))
    throw new AppError('You are already following this playlist.', 400);

  //update the followers counter in the playlist
  const playlist = await Playlist.findByIdAndUpdate(
    playlistToFollow, {
      $inc: {
        followers: 1
      }
    }, {
      new: true
    }
  );

  if (!playlist) throw new AppError('No playlist with this id', 404);

  try {
    //adding the new playlist to the user
    me.followedPlaylists.push({
      playlist: playlistToFollow,
      public: isPublic
    });

    await me.save();
  } catch (err) {
    await Playlist.findByIdAndUpdate(playlistToFollow, {
      $inc: {
        followers: -1
      }
    });
    throw err;
  }

  if (String(playlist.owner) !== String(userId))
    await notificationsController.sendFollowPlaylistNotification(playlist, me);
};
exports.followPlaylistLogic = followPlaylist;

/**
 * * A method to unfollow a playlist given the user id and the playlist id
 * @param {String} userId - The id of the user who is going to unfollow a playlist
 * @param {String} playlistId - The id of the playlist to be unfollowed
 * @returns {void}
 */
const unfollowPlaylist = async (userId, playlistId) => {
  const me = await User.findById(userId);

  const followedPlaylists = me.followedPlaylists.map(followedPlaylist =>
    followedPlaylist.playlist.toString()
  );

  // id of the new playlist
  const playlistToUnFollow = playlistId;

  if (!followedPlaylists.includes(playlistToUnFollow))
    throw new AppError('You are not following this playlist.', 400);

  //update the followers counter in the playlist
  await Playlist.findByIdAndUpdate(playlistToUnFollow, {
    $inc: {
      followers: -1
    }
  });

  // update the array of followed playlists in the user

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: {
        followedPlaylists: {
          playlist: playlistToUnFollow
        }
      }
    });
  } catch (err) {
    //update the followers counter in the playlist
    await Playlist.findByIdAndUpdate(playlistToUnFollow, {
      $inc: {
        followers: 1
      }
    });

    throw err;
  }
};
exports.unfollowPlaylistLogic = unfollowPlaylist;

const checkFollowingPlaylist = async (playlistId, userIds) => {
  if (userIds.length > 5) throw new AppError('Maximum number of ids is 5', 400);

  // array of user ids who follows this playlist
  const matchedUsers = (
    await User.find({
      _id: {
        $in: userIds
      },
      'followedPlaylists.playlist': playlistId
    })
  ).map(user => user._id.toString());

  return userIds.map(userId => matchedUsers.includes(userId));
};
exports.checkFollowingPlaylistLogic = checkFollowingPlaylist;

/* istanbul ignore next */
exports.followUser = catchAsync(async (req, res, next) => {
  await follow(req.user._id, req.body.ids, req.query.type);
  res.status(204).json({});
});

/* istanbul ignore next */
exports.checkFollowing = catchAsync(async (req, res, next) => {
  const idsToBeChecked = req.query.ids.split(',');

  const response = await checkFollowing(
    req.user._id,
    idsToBeChecked,
    req.query.type
  );

  res.status(200).json(response);
});

/* istanbul ignore next */
exports.getFollowedUsers = catchAsync(async (req, res, next) => {
  const followedUsers = await getFollowedUsers(req.user._id, req.query);
  res.status(200).json(followedUsers);
});

/* istanbul ignore next */
exports.getFollowingOfUser = catchAsync(async (req, res, next) => {
  const following = await getFollowingUser(
    req.params.id,
    req.query.limit,
    req.query.offset
  );
  res.status(200).json(following);
});

/* istanbul ignore next */
exports.getFollowersOfCurrentUser = catchAsync(async (req, res, next) => {
  const followers = await getFollowersUser(
    req.user._id,
    req.query.limit,
    req.query.offset
  );
  res.status(200).json(followers);
});

/* istanbul ignore next */
exports.getFollowersOfUser = catchAsync(async (req, res, next) => {
  const followers = await getFollowersUser(
    req.params.id,
    req.query.limit,
    req.query.offset
  );
  res.status(200).json(followers);
});

/* istanbul ignore next */
exports.unfollow = catchAsync(async (req, res, next) => {
  unfollowUsers(req.user._id, req.body.ids, req.query.type);
  res.status(204).json();
});

/* istanbul ignore next */
exports.followPlaylist = catchAsync(async (req, res, next) => {
  await followPlaylist(
    req.user._id,
    req.params.playlist_id,
    req.body.public ? req.body.public : false
  );
  res.status(200).json('Playlist followed successfully');
});

/* istanbul ignore next */
exports.unfollowPlaylist = catchAsync(async (req, res, next) => {
  await unfollowPlaylist(req.user._id, req.params.playlist_id);
  res.status(200).json('Playlist unfollowed successfully');
});

/* istanbul ignore next */
exports.checkFollowingPlaylist = catchAsync(async (req, res, next) => {
  const response = await checkFollowingPlaylist(
    req.params.playlist_id,
    req.query.ids.split(',')
  );
  res.status(200).json(response);
});
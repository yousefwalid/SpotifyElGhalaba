/**
 * Category Controller
 * @module followController
 */

const User = require('./../models/userModel');
const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');

/**
 * A method that takes user id and an array of user ids to be followed by this user
 * @param {String} userId - The id of the user who is going to follow the other ids
 * @param {Array} idsToFollow - The ids to be followed by this user id
 * @param {String} [type] - ( Optional )Follow only the ids with the specific type ex: "artist"
 * @returns {void}
 */
const follow = async (userId, idsToFollow, type) => {
    const me = await User.findById(userId);

    // the already followed ids
    const following = me.following.map(id => id.toString());

    // get the distinct ids only
    idsToFollow = idsToFollow.filter(id => !following.includes(id));

    if (type)
        idsToFollow = (await User.find({
            _id: {
                $in: idsToFollow
            },
            type: type
        })).map(user => user._id.toString());

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
};

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
        idsToBeCheckedFiltered = (await User.find({
            _id: {
                $in: idsToBeChecked
            },
            type: type
        })).map(user => user._id.toString());

    const response = idsToBeChecked.map(
        id => following.includes(id) && idsToBeCheckedFiltered.includes(id)
    );

    return response;
};

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

    const features = new ApiFeatures(
            User.find(query),
            queryParams
        )
        .skip();

    return await features.query;
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
        idsToUnfollow = (await User.find({
            _id: {
                $in: idsToUnfollow
            },
            type: type
        })).map(user => user._id.toString());

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
    await Playlist.findByIdAndUpdate(playlistToFollow, {
        $inc: {
            followers: 1
        }
    });

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

};

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

const checkFollowingPlaylist = async (playlistId, userIds) => {
    if (userIds.length > 5) throw new AppError('Maximum number of ids is 5', 400);

    // array of user ids who follows this playlist
    const matchedUsers = (await User.find({
        _id: {
            $in: userIds
        },
        'followedPlaylists.playlist': playlistId
    })).map(user => user._id.toString());

    return userIds.map(userId => matchedUsers.includes(userId));
};

exports.followUser = catchAsync(async (req, res, next) => {
    await follow(req.user._id, req.body.ids, req.query.type);
    res.status(204).json({});
});

exports.checkFollowing = catchAsync(async (req, res, next) => {
    const idsToBeChecked = req.query.ids.split(',');

    const response = await checkFollowing(
        req.user._id,
        idsToBeChecked,
        req.query.type
    );

    res.status(200).json(response);
});

exports.getFollowedUsers = catchAsync(async (req, res, next) => {
    const followedUsers = await getFollowedUsers(req.user._id, req.query);
    res.status(200).json(followedUsers);
});

exports.unfollow = catchAsync(async (req, res, next) => {
    unfollowUsers(req.user._id, req.body.ids, req.query.type);
    res.status(204).json();
});

exports.followPlaylist = catchAsync(async (req, res, next) => {
    await followPlaylist(req.user._id, req.params.playlist_id, req.body.public ? req.body.public : false);
    res.status(200).json('Playlist followed successfully');
});

exports.unfollowPlaylist = catchAsync(async (req, res, next) => {
    await unfollowPlaylist(req.user._id, req.params.playlist_id);
    res.status(200).json('Playlist unfollowed successfully');
});

exports.checkFollowingPlaylist = catchAsync(async (req, res, next) => {
    const response = await checkFollowingPlaylist(req.params.playlist_id, req.query.ids.split(','));
    res.status(200).json(response);
});
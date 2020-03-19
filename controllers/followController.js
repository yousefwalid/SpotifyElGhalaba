const User = require("./../models/userModel");
const Playlist = require('./../models/playlistModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');

exports.followUser = catchAsync(async (req, res, next) => {

    const me = await User.findById(req.user._id);

    // the already followed ids
    const following = me.following.map(id => id.toString());

    // get the distinct ids only
    const idsToFollow = req.body.ids.filter(id => !following.includes(id));

    let idsToFollowFiltered = idsToFollow;

    if (req.query.type)
        idsToFollowFiltered = (await User.find({
            "_id": {
                $in: idsToFollow
            },
            "type": req.query.type
        })).map(user => user._id.toString());


    // adding new ids to be followed to the user
    idsToFollowFiltered.forEach(id => {
        me.following.push(id);
    });

    // saving the current user
    await me.save();

    // updating followers counter of the followed users
    await User.updateMany({
        "_id": {
            $in: idsToFollowFiltered
        }
    }, {
        $inc: {
            followers: 1
        }
    });

    res.status(204).json({});
});

exports.checkFollowing = catchAsync(async (req, res, next) => {

    const me = await User.findById(req.user._id);

    // the already followed ids
    const following = me.following.map(id => id.toString());

    const idsToBeChecked = req.query.ids.split(',');

    let idsToBeCheckedFiltered = idsToBeChecked;

    if (req.query.type)
        idsToBeCheckedFiltered = (await User.find({
            "_id": {
                $in: idsToBeChecked
            },
            "type": req.query.type
        })).map(user => user._id.toString());


    const response = idsToBeChecked.map(id => following.includes(id) && idsToBeCheckedFiltered.includes(id));

    res.status(200).json(response);
});

// NOT COMPLETED
exports.getFollowedUsers = catchAsync(async (req, res, next) => {

    const {
        following
    } = await User.findById(req.user._id).populate('following');

    res.status(200).json(following);
});

exports.unfollow = catchAsync(async (req, res, next) => {

    const me = await User.findById(req.user._id);
    const following = me.following.map(id => id.toString());

    const idsToUnfollow = req.body.ids.filter(idToUnfollow => following.includes(idToUnfollow));

    let idsToUnfollowFiltered = idsToUnfollow;
    if (req.query.type)
        idsToUnfollowFiltered = (await User.find({
            "_id": {
                $in: idsToUnfollow
            },
            "type": req.query.type
        })).map(user => user._id.toString());


    me.following = following.filter(id => !idsToUnfollowFiltered.includes(id));
    await me.save();

    await User.updateMany({
        "_id": {
            $in: idsToUnfollowFiltered
        }
    }, {
        $inc: {
            followers: -1
        }
    });

    res.status(204).json();
});

exports.followPlaylist = catchAsync(async (req, res, next) => {
    const me = await User.findById(req.user._id);

    const followedPlaylists = me.followedPlaylists.map(followedPlaylist => followedPlaylist.playlist.toString());

    // id of the new playlist
    const playlistToFollow = req.params.playlist_id;

    if (followedPlaylists.includes(playlistToFollow)) throw new AppError('You are already following this playlist.', 400);

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
            public: typeof req.body.public === "boolean" ? req.body.public : true
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

    res.status(200).json("Playlist followed successfully");
});

exports.unfollowPlaylist = catchAsync(async (req, res, next) => {
    const me = (await User.findById(req.user._id));

    const followedPlaylists = me.followedPlaylists.map(followedPlaylist => followedPlaylist.playlist.toString());

    // id of the new playlist
    const playlistToUnFollow = req.params.playlist_id;

    if (!followedPlaylists.includes(playlistToUnFollow)) throw new AppError('You are not following this playlist.', 400);

    //update the followers counter in the playlist
    await Playlist.findByIdAndUpdate(playlistToUnFollow, {
        $inc: {
            followers: -1
        }
    });

    // update the array of followed playlists in the user

    try {
        await User.findByIdAndUpdate(req.user._id, {
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

    res.status(200).json("Playlist unfollowed successfully");
});

exports.checkFollowingPlaylist = catchAsync(async (req, res, next) => {
    const userIds = req.query.ids.split(',');
    if (userIds.length > 5) throw new AppError("Maximum number of ids is 5", 400);

    const playlistId = req.params.playlist_id;
    // array of user ids who follows this playlist
    const matchedUsers = (await User.find({
        "_id": {
            $in: userIds
        },
        "followedPlaylists.playlist": playlistId
    })).map(user => user._id.toString());

    const response = userIds.map(userId => matchedUsers.includes(userId));

    res.status(200).json(response);
});
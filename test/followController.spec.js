const assert = require('assert');
const {
    dropDB
} = require('../utils/dropDB');
const followController = require('../controllers/followController');
const createUserBody = require('./utils/createUser');
const User = require('../models/userModel');
const generateArtist = require('./utils/insertArtistIntoDB');
const generatePlaylist = require('./utils/generatePlaylist');
const Playlist = require('../models/playlistModel');


describe('Testing follow controller', function () {
    let me;
    let user2;
    let user1;
    let artist1;
    let artist2;
    let playlist;

    this.beforeAll(async () => {
        await dropDB();
        me = await User.create(createUserBody());
        user1 = await User.create(createUserBody());
        user2 = await User.create(createUserBody());

        artist1 = await generateArtist();
        artist2 = await generateArtist();

        playlist = await Playlist.create(generatePlaylist(user1.id));
    });

    it('Should follow users only', async function () {
        const userId = (me.id).toString();
        const userIdsToFollow = [user1.id];
        const artistIdsToFollow = [artist1.userInfo.id];
        const idsToFollow = userIdsToFollow.concat(artistIdsToFollow);

        await followController.followLogic(userId, idsToFollow, 'user');

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        userIdsToFollow.forEach(id => {
            assert.ok(following.includes(id));
        });

        artistIdsToFollow.forEach(id => {
            assert.ok(!following.includes(id));
        });

    });

    it('Should follow artists only', async function () {
        const userId = (me.id).toString();
        const userIdsToFollow = [user2.id];
        const artistIdsToFollow = [artist1.userInfo.id];
        const idsToFollow = userIdsToFollow.concat(artistIdsToFollow);

        await followController.followLogic(userId, idsToFollow, 'artist');

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        userIdsToFollow.forEach(id => {
            assert.ok(!following.includes(id));
        });

        artistIdsToFollow.forEach(id => {
            assert.ok(following.includes(id));
        });

    });


    it('Should follow both users and artists', async function () {
        const userId = (me.id).toString();
        const userIdsToFollow = [user2.id];
        const artistIdsToFollow = [artist2.userInfo.id];
        const idsToFollow = userIdsToFollow.concat(artistIdsToFollow);

        await followController.followLogic(userId, idsToFollow);

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());


        userIdsToFollow.forEach(id => {
            assert.ok(following.includes(id));
        });

        artistIdsToFollow.forEach(id => {
            assert.ok(following.includes(id));
        });

    });

    it('check if user follows users with given ids', async function () {
        const userId = (me.id).toString();
        const idsToCheck = [user2.id, user1.id];

        const response = await followController.checkFollowingLogic(userId, idsToCheck, 'user');

        response.forEach(val => {
            assert.ok(val);
        });
    });

    it('check if user follows artists with given ids', async function () {
        const userId = (me.id).toString();
        const usersIdsToCheck = [user1.id, user2.id];
        const artistsIdsToCheck = [artist1.userInfo.id, artist2.userInfo.id];
        const idsToCheck = usersIdsToCheck.concat(artistsIdsToCheck);

        const response = await followController.checkFollowingLogic(userId, idsToCheck, 'artist');

        for (let i = 0; i < idsToCheck.length; i += 1) {
            if (i < usersIdsToCheck.length) {
                assert.ok(!response[i]);
            } else {
                assert.ok(response[i]);
            }
        }
    });


    it('check if user follows users or artists with given ids', async function () {
        const userId = (me.id).toString();
        const usersIdsToCheck = [user1.id, user2.id];
        const artistsIdsToCheck = [artist1.userInfo.id, artist2.userInfo.id];
        const idsToCheck = usersIdsToCheck.concat(artistsIdsToCheck);

        const response = await followController.checkFollowingLogic(userId, idsToCheck);

        assert.ok(idsToCheck.length === response.length);

        response.forEach(val => {
            assert.ok(val);
        });
    });


    it('Get followed users', async function () {
        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        const followedUsers = await followController.getFollowedUsersLogic(me.id);

        followedUsers.forEach(user => {
            assert.ok(following.includes(user.id));
        });
    });

    it('unfollow users only', async function () {
        const usersIdsToUnfollow = [user2.id];
        const artistsIdsToUnfollow = [artist2.userInfo.id];
        const idsToUnfollow = usersIdsToUnfollow.concat(artistsIdsToUnfollow);

        await followController.unfollowUsersLogic(me.id, idsToUnfollow, 'user');

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        usersIdsToUnfollow.forEach(id => {
            assert.ok(!following.includes(id));
        });

        artistsIdsToUnfollow.forEach(id => {
            assert.ok(following.includes(id));
        });
    });


    it('unfollow artists only', async function () {
        const usersIdsToUnfollow = [user1.id];
        const artistsIdsToUnfollow = [artist2.userInfo.id];
        const idsToUnfollow = usersIdsToUnfollow.concat(artistsIdsToUnfollow);

        await followController.unfollowUsersLogic(me.id, idsToUnfollow, 'artist');

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        usersIdsToUnfollow.forEach(id => {
            assert.ok(following.includes(id));
        });

        artistsIdsToUnfollow.forEach(id => {
            assert.ok(!following.includes(id));
        });
    });

    it('unfollow both users and artists', async function () {
        const usersIdsToUnfollow = [user1.id];
        const artistsIdsToUnfollow = [artist1.userInfo.id];
        const idsToUnfollow = usersIdsToUnfollow.concat(artistsIdsToUnfollow);

        await followController.unfollowUsersLogic(me.id, idsToUnfollow);

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        usersIdsToUnfollow.forEach(id => {
            assert.ok(!following.includes(id));
        });

        artistsIdsToUnfollow.forEach(id => {
            assert.ok(!following.includes(id));
        });
    });

    it('follow a playlist', async function () {
        await followController.followPlaylistLogic(me.id, playlist.id, true);

        const {
            followedPlaylists
        } = await User.findById(me.id).select('followedPlaylists');
        const followedPlaylistsIds = followedPlaylists.map(followedPlaaylist => (followedPlaaylist.playlist).toString());

        assert.ok(followedPlaylistsIds.includes(playlist.id));
    });

    it('follow a playlist you are already following return an error 400', async function () {
        try {
            assert.rejects(await followController.followPlaylistLogic(me.id, playlist.id, true));
        } catch (err) {
            assert.ok(err.statusCode === 400);
        }
    });

    it('check if playlist followed by users', async function () {
        const usersIds = [me.id];
        const response = await followController.checkFollowingPlaylistLogic(playlist.id, usersIds);

        response.forEach(val => {
            assert.ok(val);
        });
    });

    it('check if playlist followed by users return error code 400 on more than 5 users', async function () {
        const usersIds = [me.id, user1.id, user2.id, artist1.id, artist2.id, user1.id];
        try {
            assert.rejects(await followController.checkFollowingPlaylistLogic(playlist.id, usersIds));
        } catch (err) {
            assert.ok(err.statusCode === 400);
        }
    });

    it('unfollow a playlist', async function () {
        await followController.unfollowPlaylistLogic(me.id, playlist.id);

        const {
            followedPlaylists
        } = await User.findById(me.id).select('followedPlaylists');
        const followedPlaylistsIds = followedPlaylists.map(followedPlaaylist => (followedPlaaylist.playlist).toString());

        assert.ok(!followedPlaylistsIds.includes(playlist.id));
    });


    it('unfollow a playlist you are not following returns an error 400', async function () {
        try {
            assert.rejects(await followController.unfollowPlaylistLogic(me.id, playlist.id));
        } catch (err) {
            assert.ok(err.statusCode === 400);
        }
    });


});
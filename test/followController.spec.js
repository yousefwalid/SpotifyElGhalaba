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

    this.beforeAll(async () => {
        await dropDB();
        me = await User.create(createUserBody());

    });

    it('Should follow users only', async function () {
        const userId = (me.id).toString();

        const user1 = await User.create(createUserBody());
        const userIdsToFollow = [user1.id];

        const artist1 = await generateArtist();
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

        const user2 = await User.create(createUserBody());
        const userIdsToFollow = [user2.id];

        const artist1 = await generateArtist();
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

        const user2 = await User.create(createUserBody());
        const userIdsToFollow = [user2.id];

        const artist2 = await generateArtist();
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
        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const artist = await generateArtist();
        const idsToCheck = [user.id, artist.userInfo.id];

        idsToCheck.forEach(id => {
            myuser.following.push(id);
        });

        await myuser.save();

        const response = await followController.checkFollowingLogic(me.id, idsToCheck, 'user');

        assert.ok(response[0] === true);
        assert.ok(response[1] === false);
    });

    it('check if user follows artists with given ids', async function () {
        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const artist = await generateArtist();
        const idsToCheck = [user.id, artist.userInfo.id];

        idsToCheck.forEach(id => {
            myuser.following.push(id);
        });

        await myuser.save();

        const response = await followController.checkFollowingLogic(me.id, idsToCheck, 'artist');

        assert.ok(response[0] === false);
        assert.ok(response[1] === true);
    });


    it('check if user follows users or artists with given ids', async function () {
        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const artist = await generateArtist();
        const idsToCheck = [user.id, artist.userInfo.id];

        idsToCheck.forEach(id => {
            myuser.following.push(id);
        });

        await myuser.save();

        const response = await followController.checkFollowingLogic(me.id, idsToCheck);

        response.forEach(val => {
            assert.ok(val);
        })
    });


    it('Get followed users', async function () {
        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        myuser.following.push(user.id);
        await myuser.save();

        let {
            following
        } = myuser;
        following = following.map(id => id.toString());

        const followedUsers = await followController.getFollowedUsersLogic(me.id);

        followedUsers.forEach(followedUser => {
            assert.ok(following.includes(followedUser.id));
        });
    });

    it('unfollow users only', async function () {

        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const artist = await generateArtist();
        const idsToUnfollow = [user.id, artist.userInfo.id];

        idsToUnfollow.forEach(id => {
            myuser.following.push(id);
        });

        await myuser.save();

        await followController.unfollowUsersLogic(me.id, idsToUnfollow, 'user');

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        assert.ok(following.includes(artist.userInfo.id));
        assert.ok(!following.includes(user.id));
    });


    it('unfollow artists only', async function () {
        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const artist = await generateArtist();
        const idsToUnfollow = [user.id, artist.userInfo.id];

        idsToUnfollow.forEach(id => {
            myuser.following.push(id);
        });

        await myuser.save();

        await followController.unfollowUsersLogic(me.id, idsToUnfollow, 'artist');

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        assert.ok(!following.includes(artist.userInfo.id));
        assert.ok(following.includes(user.id));
    });

    it('unfollow both users and artists', async function () {
        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const artist = await generateArtist();
        const idsToUnfollow = [user.id, artist.userInfo.id];

        idsToUnfollow.forEach(id => {
            myuser.following.push(id);
        });

        await myuser.save();

        await followController.unfollowUsersLogic(me.id, idsToUnfollow);

        let {
            following
        } = await User.findById(me.id).select('following');
        following = following.map(id => id.toString());

        assert.ok(!following.includes(artist.userInfo.id));
        assert.ok(!following.includes(user.id));
    });

    it('follow a playlist', async function () {
        const user = await User.create(createUserBody());
        const playlist = await Playlist.create(generatePlaylist(user.id));

        await followController.followPlaylistLogic(me.id, playlist.id, true);

        const {
            followedPlaylists
        } = await User.findById(me.id).select('followedPlaylists');
        const followedPlaylistsIds = followedPlaylists.map(followedPlaaylist => (followedPlaaylist.playlist).toString());

        assert.ok(followedPlaylistsIds.includes(playlist.id));
    });

    it('follow a playlist you are already following return an error 400', async function () {
        const myuser = await User.findById(me.id);
        const user = await User.create(createUserBody());
        const playlist = await Playlist.create(generatePlaylist(user.id));

        myuser.followedPlaylists.push({
            playlist: playlist.id,
            public: true
        });
        await myuser.save();

        try {
            assert.rejects(await followController.followPlaylistLogic(me.id, playlist.id, true));
        } catch (err) {
            assert.ok(err.statusCode === 400);
        }
    });

    it('check if playlist followed by users', async function () {
        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const playlist = await Playlist.create(generatePlaylist(user.id));

        myuser.followedPlaylists.push({
            playlist: playlist.id,
            public: true
        });

        await myuser.save();

        const usersIds = [me.id];
        const response = await followController.checkFollowingPlaylistLogic(playlist.id, usersIds);

        response.forEach(val => {
            assert.ok(val);
        });
    });

    it('check if playlist followed by users return error code 400 on more than 5 users', async function () {

        const usersIds = [];
        for (let i = 0; i < 6; i += 1) {
            usersIds.push(me.id);
        }

        const playlist = await Playlist.create(generatePlaylist(me.id));

        try {
            assert.rejects(await followController.checkFollowingPlaylistLogic(playlist.id, usersIds));
        } catch (err) {
            assert.ok(err.statusCode === 400);
        }
    });

    it('unfollow a playlist', async function () {

        const myuser = await User.findById(me.id);

        const user = await User.create(createUserBody());
        const playlist = await Playlist.create(generatePlaylist(user.id));

        myuser.followedPlaylists.push({
            playlist: playlist.id,
            public: true
        });

        await myuser.save();

        await followController.unfollowPlaylistLogic(me.id, playlist.id);

        const {
            followedPlaylists
        } = await User.findById(me.id).select('followedPlaylists');
        const followedPlaylistsIds = followedPlaylists.map(followedPlaaylist => (followedPlaaylist.playlist).toString());

        assert.ok(!followedPlaylistsIds.includes(playlist.id));
    });


    it('unfollow a playlist you are not following returns an error 400', async function () {
        const playlist = await Playlist.create(generatePlaylist(me.id));

        try {
            assert.rejects(await followController.unfollowPlaylistLogic(me.id, playlist.id));
        } catch (err) {
            assert.ok(err.statusCode === 400);
        }
    });
});
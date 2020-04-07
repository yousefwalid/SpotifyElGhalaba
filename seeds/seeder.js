/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ObjectId } = require('mongoose').Types;
const faker = require('faker');

const randomizeNumber = require('./utils/randomizeNumber');
const userSeed = require('./data/users');
const artistSeed = require('./data/artists');
const albumSeed = require('./data/albums');
const trackSeed = require('./data/tracks');
const playlistSeed = require('./data/playlist');

const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');
const Album = require('./../models/albumModel');
const Track = require('./../models/trackModel');
const PlayHistory = require('./../models/playHistoryModel');
const Playlist = require('./../models/playlistModel');

const connectDB = require('./../utils/connectDB');
const disconnectDB = require('./../utils/disconnectDB');
const { dropDB } = require('./../utils/dropDB');

const createTracks = async albums => {
  const trackObjects = trackSeed.trackObjects();
  const tracks = [];
  let trackIndex = 0;
  for (let j = 0; j < albums.length; j += 1) {
    const album = albums[j];
    const trackCount = randomizeNumber(1, 2);

    for (let i = 0; i < trackCount; i += 1) {
      const newTrack = {
        ...trackObjects[trackIndex],
        album: new ObjectId(album._id),
        artists: album.artists.map(el => new ObjectId(el))
      };

      // eslint-disable-next-line no-await-in-loop
      const track = await Track.create(newTrack);
      tracks.push(track);
      trackIndex += 1;
    }
  }

  return tracks;
};

const createPlayHistories = async (userIds, trackIds) => {
  const playHistories = [];

  for (let i = 0; i < userIds.length; i += 1) {
    const tracksCount = randomizeNumber(3, 6);
    const tracksIndexes = randomizeNumber(
      0,
      trackIds.length - 1,
      tracksCount,
      true
    );
    for (let j = 0; j < tracksIndexes.length; j += 1) {
      // eslint-disable-next-line camelcase
      const played_at = faker.date.past(3);
      // eslint-disable-next-line no-await-in-loop
      const playHistory = await PlayHistory.create({
        user: new ObjectId(userIds[i]),
        track: new ObjectId(trackIds[j]),
        played_at: played_at
      });
      playHistories.push(playHistory);
    }
  }
  return playHistories;
};

(async function() {
  process.env.NODE_ENV = 'seed';
  await connectDB();
  await dropDB();

  const { userObjects, artistInfoObjects, adminObjects } = userSeed();

  const users = [];
  const artistsInfo = [];
  const admins = [];

  for (let i = 0; i < userObjects.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create(userObjects[i]);
    users.push(user);
  }

  for (let i = 0; i < artistInfoObjects.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create(artistInfoObjects[i]);
    artistsInfo.push(user);
  }

  for (let i = 0; i < adminObjects.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create(adminObjects[i]);
    admins.push(user);
  }

  // const users = await User.insertMany(userObjects);
  // const artistsInfo = await User.insertMany(artistInfoObjects);
  // const admins = await User.insertMany(adminObjects);

  const usersIds = artistsInfo.map(el => el._id);

  const artistObjects = artistSeed(usersIds);
  const artists = await Artist.insertMany(artistObjects);
  const artistsIds = artists.map(el => el._id);

  const albumObjects = albumSeed.albumObjects(artistsIds);

  let albums = [];

  for (let i = 0; i < albumObjects.length; i += 1) {
    const album = await Album.create(albumObjects[i]);
    albums.push(album);
  }

  //let albums = await Album.insertMany(albumObjects);

  const tracks = await createTracks(albums);
  const tracksIds = tracks.map(el => el._id);

  albums = await Album.find({});

  const playHistories = await createPlayHistories(usersIds, tracksIds);

  const playlistObjects = playlistSeed(usersIds, tracksIds);
  const playlists = await Playlist.insertMany(playlistObjects);
  const playlistsIds = playlists.map(el => el._id);

  await disconnectDB();
})();

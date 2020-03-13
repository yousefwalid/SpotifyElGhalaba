const mongoose = require('mongoose');
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const Track = require('./../models/trackModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAlbum = catchAsync(async (req, res, next) => {
  const album = await Album.findById(req.params.id).populate('tracks');
  if (!album) {
    return next(new AppError('No album found with that ID', 404));
  }
  res.status(200).json(album);
});
//Fucntion used to seed db with some tracks
exports.saveDocs = catchAsync(async (req, res, next) => {
  const track = new Track({
    _id: new mongoose.Types.ObjectId(),

    disc_number: 1,
    duration_ms: 207959,
    explicit: false,
    external_ids: {
      isrc: 'USUM71703861'
    },
    external_urls: {
      spotify: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl'
    },
    href: 'https://api.spotify.com/v1/tracks/11dFghVXANMlKmJXsNCbNl',
    id: '11dFghVXANMlKmJXsNCbNl',
    is_local: false,
    name: 'Cut To The Feeling',
    popularity: 63,
    preview_url:
      'https://p.scdn.co/mp3-preview/3eb16018c2a700240e9dfb8817b6f2d041f15eb1?cid=774b29d4f13844c495f206cafdad9c86',
    track_number: 1,
    type: 'track',
    uri: 'spotify:track:11dFghVXANMlKmJXsNCbNl'
  });
  track.save(function(err) {
    if (err) {
      //console.log(`Error saving track${err}`);
    }
  });
  const album = await Album.findById(req.params.id);
  album.tracks.push(track._id);
  album.save(function(err) {
    if (err) {
      //console.log(`Error saving track to album ${err}`);
    }
  });

  res.status(200).json('success');
});

exports.getAlbumTracks = catchAsync(async (req, res, next) => {
  const offset = req.query.offset * 1 || 0;
  const limit =
    req.query.limit >= 1 && req.query.limit <= 50 ? req.query.limit * 1 : 20;
  const Tracks = await Album.findById(req.params.id)
    .select('tracks')
    .populate('tracks');

  const limitedTracks = Tracks.tracks.slice(offset, limit + offset);

  if (!Tracks) {
    return next(new AppError('No album found with that ID', 404));
  }
  res.status(200).json({
    href: `http://localhost:${process.env.PORT}/v1/albums/${req.params.id}`,
    items: limitedTracks
  });
});

exports.getSeveralAlbums = catchAsync(async (req, res, next) => {
  let AlbumsIds = req.query.ids.split(',');
  if (AlbumsIds.length > 20) {
    AlbumsIds = AlbumsIds.slice(0, 20);
  }
  const Albums = [];
  for (let i = 0; i < AlbumsIds.length; i++) {
    result = await Album.findById(AlbumsIds[i]);
    if (!result) {
      Albums[i] = null;
    } else {
      Albums[i] = result;
    }
  }
  if (!Albums) {
    return next(new AppError('No albums found'), 404);
  }
  res.status(200).json({
    Albums
  });
});

exports.createAlbum = catchAsync(async (req, res, next) => {
  const newAlbum = req.body;
  newAlbum.release_date = new Date();
  newAlbum.artists = req.user._id;

  await Album.create(newAlbum);
  res.status(201).json(newAlbum);
});

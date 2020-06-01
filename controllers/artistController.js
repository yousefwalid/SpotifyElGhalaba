const mongoose = require('mongoose');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Artist = require('./../models/artistModel');
const Track = require('./../models/trackModel');
const albumController = require('./albumController');
const playHistory = require('./../models/playHistoryModel');

const getArtist = async artistId => {
  if (!artistId) throw new AppError('Artist id not specified', 400);

  const artist = await Artist.find({
    $or: [{ _id: artistId }, { userInfo: artistId }]
  }).select(
    'external_urls biography genres followers href id images popularity uri type name'
  );

  if (!artist) throw new AppError('No artist found with that id', 404);

  return artist;
};

const getMultipleArtists = async artistsIds => {
  if (!artistsIds || artistsIds === '')
    throw new AppError('Artists ids not specified', 400);

  artistsIds = artistsIds.split(',');

  console.log(artistsIds);
  if (!artistsIds || artistsIds.length === 0)
    throw new AppError('Artists ids not specified', 400);

  if (artistsIds.length > 50)
    throw new AppError(
      'Cannot retrieve more than 50 artists in one request',
      400
    );

  const artists = (
    await Artist.find({
      $or: [{ _id: { $in: artistsIds } }, { userInfo: { $in: artistsIds } }]
    }).select(
      'external_urls biography genres followers href id images popularity uri type name'
    )
  ).map(el => el.toJSON());

  return artists;
};

const getArtistAlbums = async (artistId, limit, offset) => {
  limit = limit * 1 || 20;
  offset = offset * 1 || 0;

  if (!artistId) throw new AppError('Artist id not specified', 400);

  const artist = await Artist.findOne({
    $or: [{ _id: artistId }, { userInfo: artistId }]
  }).select('albums');

  if (!artist) throw new AppError('No artist found with that id', 404);

  const albumsIds = artist.albums;

  const pagingObject = await albumController.getSeveralSimplifiedAlbums(
    albumsIds,
    limit,
    offset
  );

  pagingObject.href = `http://localhost:${process.env.PORT}/api/v1/artists/${artistId}/albums`;

  return pagingObject;
};

const getArtistTopTracks = async artistId => {
  if (!artistId) throw new AppError('Artist id not specified', 400);

  const userInfoId = await Artist.findOne({ userInfo: artistId }); // retrieve the artist Id from the userInfoId

  if (userInfoId) artistId = userInfoId._id;

  const topTracks = await Track.find({ artists: artistId })
    .sort({ played: -1 })
    .limit(10)
    .select(
      'album artists disc_number duration_ms explicit external_ids external_urls href id name popularity preview_url track_number type uri played'
    )
    .populate([
      {
        path: 'album',
        select: 'album_type artists external_urls href id images name type uri',
        populate: {
          path: 'artists',
          select: 'external_urls href id name type uri'
        }
      },
      {
        path: 'artists',
        select: 'external_urls href id name type uri'
      }
    ]);

  topTracks.map(track => {
    track.artists.map(artist => {
      artist.userInfo = undefined;
    });
    if (track.album && track.album.artists) {
      track.album.artists.map(artist => {
        artist.userInfo = undefined;
      });
    }
  });

  return topTracks;
};

const getArtistRelatedArtists = async artistId => {
  if (!artistId) throw new AppError('Artist id not specified', 400);

  const userInfoId = await Artist.findOne({ userInfo: artistId }); // retrieve the artist Id from the userInfoId

  if (userInfoId) artistId = userInfoId._id;

  const users = await playHistory.aggregate([
    {
      $lookup: {
        from: 'Tracks',
        localField: 'track',
        foreignField: '_id',
        as: 'track'
      }
    },
    {
      $project: {
        track: { $arrayElemAt: ['$track', 0] },
        user: 1
      }
    },
    {
      $project: {
        artist: { $arrayElemAt: ['$track.artists', 0] },
        user: 1
      }
    },
    {
      $match: {
        artist: mongoose.Types.ObjectId(artistId)
      }
    },
    {
      $group: {
        _id: {
          userId: '$user'
        },
        played: {
          $sum: 1
        }
      }
    },
    {
      $sort: {
        played: -1
      }
    },
    {
      $limit: 5000
    }
  ]);

  for (let i = 0; i < users.length; i += 1) {
    users[i] = users[i]._id.userId;
  }

  const artistsIds = await playHistory.aggregate([
    {
      $lookup: {
        from: 'Tracks',
        localField: 'track',
        foreignField: '_id',
        as: 'track'
      }
    },
    {
      $project: {
        track: { $arrayElemAt: ['$track', 0] },
        user: 1
      }
    },
    {
      $project: {
        artist: { $arrayElemAt: ['$track.artists', 0] },
        user: 1
      }
    },
    {
      $match: {
        user: { $in: users },
        artist: { $ne: mongoose.Types.ObjectId(artistId) }
      }
    },
    {
      $group: {
        _id: {
          artist: '$artist'
        },
        played: {
          $sum: 1
        }
      }
    },
    {
      $sort: { played: -1 }
    }
  ]);

  for (let i = 0; i < artistsIds.length; i += 1)
    artistsIds[i] = mongoose.Types.ObjectId(artistsIds[i]._id.artist);

  const artists = await Artist.find({ _id: { $in: artistsIds } })
    .select(
      'external_urls biography genres followers href id images popularity uri type name'
    )
    .limit(20);

  return artists;
};

exports.getArtist = catchAsync(async (req, res, next) => {
  const artist = await getArtist(req.params.id);
  res.status(200).json(artist);
});

exports.getMultipleArtists = catchAsync(async (req, res, next) => {
  const artists = await getMultipleArtists(req.query.ids);
  res.status(200).json(artists);
});

exports.getArtistAlbums = catchAsync(async (req, res, next) => {
  const albums = await getArtistAlbums(
    req.params.id,
    req.query.limit,
    req.query.offset
  );
  res.status(200).json(albums);
});

exports.getArtistTopTracks = catchAsync(async (req, res, next) => {
  const tracks = await getArtistTopTracks(req.params.id);
  res.status(200).json(tracks);
});

exports.getArtistRelatedArtists = catchAsync(async (req, res, next) => {
  const artists = await getArtistRelatedArtists(req.params.id);
  res.status(200).json(artists);
});

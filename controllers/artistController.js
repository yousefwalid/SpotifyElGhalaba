const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const imageObject = require('./../models/objects/imageObject');
const multer = require('multer');
const sharp = require('sharp');
const Artist = require('./../models/artistModel');
const User = require('./../models/userModel');
const albumController = require('./albumController');

const getArtist = async artistId => {
  if (!artistId) throw new AppError('Artist id not specified', 400);
  const artist = (
    await Artist.findById(artistId)
      .select(
        'external_urls biography genres followers href id images popularity uri type userInfo name'
      )
      .populate({
        path: 'userInfo',
        select: 'name'
      })
  ).toJSON();

  if (!artist) throw new AppError('No artist found with that id', 404);

  artist.name = artist.userInfo.name;
  artist.userInfo = undefined;

  return artist;
};

const getMultipleArtists = async artistsIds => {
  if (!artistsIds || artistsIds.length === 0)
    throw new AppError('Artists ids not specified', 400);

  if (artistsIds.length > 50)
    throw new AppError(
      'Cannot retrieve more than 50 artists in one request',
      400
    );

  const artists = (
    await Artist.find({ _id: { $in: artistsIds } })
      .select(
        'external_urls biography genres followers href id images popularity uri type userInfo name'
      )
      .populate({
        path: 'userInfo',
        select: 'name'
      })
  ).map(el => el.toJSON());

  artists.forEach(artist => {
    artist.name = artist.userInfo.name;
    artist.userInfo = undefined;
  });

  return artists;
};

const getArtistAlbums = async (artistId, limit, offset) => {
  limit = limit * 1 || 20;
  offset = offset * 1 || 0;

  if (!artistId) throw new AppError('Artist id not specified', 400);

  const albumsIds = (await Artist.findById(artistId).select('albums')).albums;

  const pagingObject = await albumController.getSeveralSimplifiedAlbums(
    albumsIds,
    limit,
    offset
  );

  pagingObject.href = `http://localhost:${process.env.PORT}/api/v1/artists/${artistId}/albums`;

  return pagingObject;
};

exports.getArtist = catchAsync(async (req, res, next) => {
  const artist = await getArtist(req.params.id);
  res.status(200).json(artist);
});

exports.getMultipleArtists = catchAsync(async (req, res, next) => {
  const artists = await getMultipleArtists(req.body.ids);
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

exports.getArtistTopTracks = catchAsync(async (req, res, next) => {});

exports.getArtistRelatedArtists = catchAsync(async (req, res, next) => {});

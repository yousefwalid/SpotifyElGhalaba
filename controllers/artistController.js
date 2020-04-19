const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Artist = require('./../models/artistModel');
const albumController = require('./albumController');

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

exports.getArtistByUserInfoId = catchAsync(async (req, res, next) => {
  const artist = await getArtistByUserInfo(req.params.id);
  res.status(200).json(artist);
});

exports.getMultipleArtistsByUserInfoIds = catchAsync(async (req, res, next) => {
  const artist = await getMultipleArtistsByUserInfoIds(req.body.ids);
  res.status(200).json(artist);
});

exports.getArtistTopTracks = catchAsync(async (req, res, next) => {});

exports.getArtistRelatedArtists = catchAsync(async (req, res, next) => {});

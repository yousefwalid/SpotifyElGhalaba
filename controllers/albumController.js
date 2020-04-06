/**
 * This contains all the business logic for the album controller
 * @module AlbumController
 */
const mongoose = require('mongoose');
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const Track = require('./../models/trackModel');
const Artist = require('./../models/artistModel');
const catchAsync = require('./../utils/catchAsync');
const filterObj = require('./../utils/filterObject');

/**
 * Gets a track with a specific ID
 * @param {String} albumID - The id of the desired track
 * @returns {AlbumObject} The album with the specified ID
 */
const getAlbum = async (albumID, next) => {
  const album = await Album.findById(albumID).populate('tracks');
  if (!album) {
    throw new AppError('No album found with that ID', 404);
  }
  return album;
};

/**
 * Gets several albums based on the given IDs
 * @param {Array<Numbers>} AlbumsIds - List of required albums ids
 * @returns {Array<AlbumObject>} Array of the required albums
 */

const getSeveralAlbums = async (AlbumsIds, next) => {
  if (AlbumsIds.length > 20) {
    AlbumsIds = AlbumsIds.slice(0, 20);
  }
  //Returns the avaliable albums IDs in the DB
  const Albums = await Album.find({ _id: { $in: AlbumsIds } });
  //Iterate on the list of IDs and if not found add a null
  let albumList = [];
  AlbumsIds.forEach(el => {
    let found = false;
    for (let i = 0; i < Albums.length; i += 1) {
      if (el === Albums[i].id) {
        albumList.push(Albums[i]);
        found = true;
        break;
      }
    }
    if (!found) {
      albumList.push(null);
    }
  });
  return albumList;
};
/**
 * Validates the ranges of limit and offset
 * @param {Number} limit The limit parameter, defaults to 20 if not passed
 * @param {Number} offset The offset parameter, defaults to 0 if not passed
 */

const validateLimitOffset = (limit, offset) => {
  limit = limit * 1 || 20;
  offset = offset * 1 || 0;

  if (limit <= 0)
    throw new AppError(
      'Limit query parameter can not be less than or equal to 0',
      400
    );

  if (limit > 50)
    throw new AppError('Limit query parameter can not be greater than 50', 400);

  return { limit, offset };
};

/**
 * Get's urls of next page and previous page
 * @param {Number} offset - The number of docs to skip
 * @param {Number} limit - The docs limit of the response
 * @param {Number} totalCount -the total number of docs
 */
const getNextAndPrevious = (offset, limit, totalCount) => {
  const nextPage =
    offset + limit <= totalCount
      ? `http://localhost:${process.env.PORT}/api/v1/albums/?offset=${offset +
          limit}&limit=${limit}`
      : null;
  const previousPage =
    offset - limit >= 0
      ? `http://localhost:${process.env.PORT}/api/v1/albums/?offset=${offset -
          limit}&limit=${limit}`
      : null;
  return { nextPage, previousPage };
};
/**
 * Gets the tracks of the specified album
 * @param {String} albumID - The required album ID
 * @param {Number} Limit - Limit of the response tracks'
 * @param {Number} Offset - Number of tracks to skip
 * @param {String} url - The URL of the request
 */

const getAlbumTracks = async (albumID, limit, offset, url) => {
  const Tracks = await Album.findById(albumID)
    .select('tracks')
    .populate('tracks');
  if (!Tracks) {
    throw new AppError('No Album found with this ID', 404);
  }
  const totalCount = Tracks.tracks.length;
  const limitedTracks = Tracks.tracks.slice(offset, limit + offset);
  const { nextPage, previousPage } = getNextAndPrevious(
    offset,
    limit,
    totalCount
  );

  const pagingObject = {
    href: `http://localhost:${process.env.PORT}/v1/albums${url}`,
    items: limitedTracks,
    limit,
    next: nextPage,
    offset,
    previous: previousPage,
    total: totalCount
  };
  return pagingObject;
};
/**
 *
 * @param {object} requestBody - The body of the request
 * @param {UserObject} currentUser -The logged in user data
 * @returns The created album object
 */

const createAlbum = async (requestBody, currentUser) => {
  const reqObject = filterObj(requestBody, [
    'album_type',
    'genres',
    'label',
    'name'
  ]);
  const newAlbum = reqObject;
  newAlbum.release_date = new Date();
  const artist = await Artist.findOne({ userInfo: currentUser._id });
  newAlbum.artists = artist._id;
  const createdAlbum = await Album.create(newAlbum);
  return createdAlbum;
};

/* istanbul ignore next */
exports.getAlbum = catchAsync(async (req, res, next) => {
  if (!req.params.id) {
    return next('Please provide album ID');
  }
  const album = await getAlbum(req.params.id);
  res.status(200).json(album);
});

/* istanbul ignore next */
exports.getAlbumTracks = catchAsync(async (req, res, next) => {
  const { limit, offset } = validateLimitOffset(
    req.query.limit,
    req.query.offset
  );
  const pagingObject = await getAlbumTracks(
    req.params.id,
    limit,
    offset,
    req.url,
    next
  );
  res.status(200).json(pagingObject);
});

/* istanbul ignore next */
exports.getSeveralAlbums = catchAsync(async (req, res, next) => {
  if (req.query.ids == '') {
    return next(new AppError('Please provide album IDs', 400));
  }
  let AlbumsIds = req.query.ids.split(',');
  let albumList = await getSeveralAlbums(AlbumsIds);
  res.status(200).json({
    Albums: albumList
  });
});

/* istanbul ignore next */
exports.createAlbum = catchAsync(async (req, res, next) => {
  const newAlbum = await createAlbum(req.body, req.user);
  res.status(201).json(newAlbum);
});
exports.createAlbumLogic = createAlbum;
exports.getSeveralAlbumsLogic = getSeveralAlbums;
exports.getAlbumTracksLogic = getAlbumTracks;
exports.getAlbumLogic = getAlbum;
exports.validateLimitOffset = validateLimitOffset;

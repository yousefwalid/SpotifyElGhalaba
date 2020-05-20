/**
 * This contains all the business logic for the album controller
 * @module AlbumController
 */
const mongoose = require('mongoose');
const sharp = require('sharp');
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const Track = require('./../models/trackModel');
const Artist = require('./../models/artistModel');
const catchAsync = require('./../utils/catchAsync');
const filterObj = require('./../utils/filterObject');
const AwsS3Api = require('./../utils/awsS3Api');
const uploadAWSImage = require('../utils/uploadAWSImage');
const validateLimitOffset = require('./../utils/validateLimitOffset');
const { ObjectId } = require('mongoose').Types;

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
 * Get's urls of next page and previous page
 * @param {Number} offset - The number of docs to skip
 * @param {Number} limit - The docs limit of the response
 * @param {Number} totalCount -the total number of docs
 */
const getNextAndPrevious = (offset, limit, totalCount) => {
  const nextPage =
    offset + limit <= totalCount
      ? `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${process.env.API_VERSION}/albums/?offset=${offset +
          limit}&limit=${limit}`
      : null;
  const previousPage =
    offset - limit >= 0
      ? `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${process.env.API_VERSION}/albums/?offset=${offset -
          limit}&limit=${limit}`
      : null;
  return { nextPage, previousPage };
};
/* istanbul ignore next */
exports.getSeveralSimplifiedAlbums = async (albumsIds, limit, offset) => {
  limit = limit * 1 || 20;
  offset = offset * 1 || 0;

  if (limit < 1 || limit > 50)
    throw new AppError('Invalid limit value (out of range or negative)', 400);

  if (offset < 0) throw new AppError('Offset cannot be negative', 400);

  const albums = await Album.find({ _id: { $in: albumsIds } })
    .select(
      'album_type artists external_urls id href images name release_date type uri'
    )
    .populate({
      path: 'artists',
      select: 'external_urls href id name type uri'
    })
    .limit(limit)
    .skip(offset);

  const albumsCount = await Album.find({
    _id: { $in: albumsIds }
  }).countDocuments();

  const { nextPage, previousPage } = getNextAndPrevious(
    offset,
    limit,
    albumsCount
  );

  const pagingObject = {
    items: albums,
    limit: limit,
    offset: offset,
    next: nextPage,
    previous: previousPage,
    total: albumsCount
  };

  return pagingObject;
};

/**
 * Gets several albums based on the given IDs
 * @param {Array<Numbers>} AlbumsIds - List of required albums ids
 * @returns {Array<AlbumObject>} Array of the required albums
 */

const getSeveralAlbums = async AlbumsIds => {
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
    href: `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${process.env.API_VERSION}/albums${url}`,
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
/**
 * Function that uploads the given image and it's different sized to AWS bucket
 * @param {Object} fileData -the buffer of the uploaded image
 * @param {String} albumID -the ID of the album that the images will be uploaded to
 */
const uploadImage = async (fileData, albumID) => {
  if (!fileData) throw new AppError('Invalid file uploaded', 400);
  if (!albumID) throw new AppError('album id not specified', 400);
  const album = await Album.findById(albumID);
    /*istanbul ignore next*/
  if (!album) {
    throw new AppError('Album not found', 404);
  }
  /*istanbul ignore next*/
  const dimensions = [
    [640, 640],
    [300, 300],
    [60, 60]
  ];
  /*istanbul ignore next*/
  const qualityNames = ['High', 'Medium', 'Low'];
  /*istanbul ignore next*/
  const imgObjects = await uploadAWSImage(
    fileData,
    'album',
    albumID,
    dimensions,
    qualityNames
  );

  /*istanbul ignore next*/
  album.images = imgObjects;
  /*istanbul ignore next*/
  await album.save();
};
/**
 *
 * @param {String} albumID -The ID of the album to be modified
 * @param {Object} body -The keys in the album that will be modified with their new values
 * @param {String} userID -The logged in user ID
 */
const updateAlbum = async (albumID, body, userID) => {
  const filteredObject = filterObj(body, ['name', 'album_type', 'label']);
  const album = await Album.findById(albumID);

  if (!album) throw new AppError('No album found with this ID', 404);

  const artist = await Artist.findOne({ userInfo: new ObjectId(userID) });

  if (!album.artists.includes(artist.id))
    throw new AppError(
      'Only the Artist of the album can update the album info',
      403
    );
  const updatedAlbum = await Album.findByIdAndUpdate(albumID,filteredObject,{new:true});
  return updatedAlbum;
};

/**
 * Sets an album active property with a given ID to false 
 * @param {String} trackID -The track ID to be deleted
 */
const removeAlbum = async (albumID,userID) => {
  const artist=await Artist.findOne({userInfo:new ObjectId(userID)});
  const album=await Album.findById(albumID);

  if(!album)
    throw new AppError("No album was found with this ID",404);
  
  if(!album.artists.includes(artist.id))
    throw new AppError("Only the album artists can remove their track",403);
  
  await Album.findByIdAndUpdate(albumID,{active:false});
};
/* istanbul ignore next */
exports.removeAlbum=catchAsync(async(req,res)=>{
  await removeAlbum(req.params.id,req.user._id);
  res.status(200).send();
})

/*istanbul ignore next*/
exports.updateAlbum = catchAsync(async (req, res) => {
  const modifiedAlbum = await updateAlbum(req.params.id, req.body, req.user._id);
  res.status(200).send(modifiedAlbum);
});
/*istanbul ignore next*/
exports.uploadImage = catchAsync(async (req, res, next) => {
  await uploadImage(req.files.image.data, req.params.id);
  res.status(202).json({
    status: 'success',
    message: 'Image Uploaded successfully'
  });
});

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
  let albumList = await getSeveralAlbums(req);
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
exports.uploadImageLogic = uploadImage;
exports.getNextAndPrevious = getNextAndPrevious;
exports.updateAlbumLogic = updateAlbum;
exports.removeAlbumLogic=removeAlbum;

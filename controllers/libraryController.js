const savedAlbum = require('./../models/savedAlbumModel');
const savedTrack = require('./../models/savedTrackModel');
const Track = require('./../models/trackModel');
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const validateLimitOffset = require('./../utils/validateLimitOffset');
/**
 * This contains all the business logic for the library controller
 * @module LibraryController
 */

/**
 * Save Album or Track to user's library based on the passed model
 * @param {Array<String>} IDs -The Ids of the objects required to be saved
 * @param {Model} Model -Album Model or Track Model
 * @param {UserObject} User -The logged in user details
 * @returns The saved object
 */
const saveForCurrentUser = async (IDs, Model, User) => {
  let modelName;
  let savedModel;
  if (Model === Track) {
    modelName = 'track';
    savedModel = savedTrack;
  } else {
    modelName = 'album';
    savedModel = savedAlbum;
  }
  const ModelIDs = IDs;
  const count = await savedModel.countDocuments({
    user: User._id
  });
  /*istanbul ignore next*/
  if (count >= 10000) {
    throw new AppError(`Reached max number of saved ${modelName}s`, 403);
  }
  const ModelDocs = await Model.find({
    _id: {
      $in: ModelIDs
    }
  });
  if (ModelDocs.length < 1) {
    throw new AppError(`No ${modelName}s found`, 404);
  }
  const filteredModelIds = [];
  ModelDocs.forEach(el => {
    filteredModelIds.push(el._id);
  });
  const query = {};
  query[modelName] = {
    $in: filteredModelIds
  };
  query['user'] = User._id;
  const currentlySavedModel = await savedModel.find(query);
  currentlySavedModel.forEach(el => {
    /*istanbul ignore next*/
    for (let i = 0; i < filteredModelIds.length; i += 1) {
      if (String(el[modelName]) === String(filteredModelIds[i])) {
        filteredModelIds.splice(i, 1);
      }
    }
  });
  const savedModelDocs = [];
  filteredModelIds.forEach(el => {
    const newModel = {};
    newModel[modelName] = el;
    newModel.added_at = new Date();
    newModel.user = User._id;
    savedModelDocs.push(newModel);
  });
  savedModel.create(savedModelDocs);
  return savedModelDocs;
};

/**
 * Get's urls of next page and previous page
 * @param {Number} offset - The number of docs to skip
 * @param {Number} limit - The docs limit of the response
 * @param {Model} modelName -The model name {Album,Track}
 * @param {Number} totalCount -the total number of docs
 */
const getNextAndPrevious = (offset, limit, modelName, totalCount) => {
  const nextPage =
    offset + limit <= totalCount
      ? `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${
          process.env.API_VERSION
        }/me/${modelName}s/?offset=${offset + limit}&limit=${limit}`
      : null;
  const previousPage =
    offset - limit >= 0
      ? `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${
          process.env.API_VERSION
        }/me/${modelName}s/?offset=${offset - limit}&limit=${limit}`
      : null;
  return {
    nextPage,
    previousPage
  };
};
/**
 * Gets the saved albums/tracks of the logged in user
 * @param {UserObject} user -The logged in user details
 * @param {Number} limit -The docs limit of the response
 * @param {Number} offset -The number of docs to skip
 * @param {Model} Model -The required model {Album,Track}
 * @param {String} url -The request url
 * @returns The saved documents wrapped in a paging object
 */
const getSavedModel = async (user, limit, offset, Model, url) => {
  let modelName;
  let savedModel;
  /*istanbul ignore next*/
  if (Model === Track) {
    modelName = 'track';
    savedModel = savedTrack;
  } else if (Model == Album) {
    modelName = 'album';
    savedModel = savedAlbum;
  } else {
    throw new AppError('Invalid model', 400);
  }
  let savedDocs;
  /*istanbul ignore next*/
  if (modelName == 'track') {
    savedDocs = await savedModel
      .find({
        user: user._id
      })
      .select('-user -__v')
      .skip(offset)
      .limit(limit)
      .populate([
        {
          path: modelName,
          populate: [
            {
              path: 'album',
              select: '-tracks'
            },
            {
              path: 'artists',
              select: 'name'
            }
          ]
        }
      ]);
    savedDocs.forEach((doc, index) => {
      if (doc.track === null) {
        savedDocs.splice(index, 1);
      }
    });
  } else {
    savedDocs = await savedModel
      .find({
        user: user._id
      })
      .select('-user -__v')
      .skip(offset)
      .limit(limit)
      .populate([
        {
          path: modelName,
          populate: [
            {
              path: 'tracks',
              populate: [
                {
                  path: 'artists',
                  select: 'name'
                }
              ]
            },
            {
              path: 'artists',
              select: 'name'
            }
          ]
        }
      ]);
    savedDocs.forEach((doc, index) => {
      if (doc.album === null) {
        savedDocs.splice(index, 1);
      }
    });
  }
  const totalCount = await savedModel.countDocuments({
    user: user._id
  });
  const { nextPage, previousPage } = getNextAndPrevious(
    offset,
    limit,
    modelName,
    totalCount
  );
  const pagingObject = {
    href: `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${process.env.API_VERSION}/me${url}`,
    items: savedDocs,
    limit,
    next: nextPage,
    offset,
    previous: previousPage,
    total: totalCount
  };
  return pagingObject;
};
/**
 * Checks if the specified tracks,albums exist in the user's library
 * @param {Array<String>} IDs - The ids to check for
 * @param {Model} Model - The Model to work on {Album,Track}
 * @return Boolean array
 */
const checkUsersSavedModel = async (IDs, Model, User) => {
  let modelName;
  let savedModel;
  /*istanbul ignore next*/
  if (Model === Track) {
    modelName = 'track';
    savedModel = savedTrack;
  } else {
    modelName = 'album';
    savedModel = savedAlbum;
  }
  const query = {};
  query[modelName] = {
    $in: IDs
  };
  query['user'] = User._id;
  const currentlySavedDocs = await savedModel.find(query);
  const boolArray = [];
  IDs.forEach(el => {
    let found = false;
    for (let i = 0; i < currentlySavedDocs.length; i += 1) {
      if (String(el) === String(currentlySavedDocs[i][modelName])) {
        boolArray.push(true);
        found = true;
        break;
      }
    }
    if (!found) {
      boolArray.push(false);
    }
  });
  return boolArray;
};
/**
 * Deletes the documents with the specified {track,album} ids
 * @param {Array<String>} IDs -The ids to be deleted
 * @param {UserObject} user -The logged in user details
 * @param {Model} Model -The Model to work on {Album,Track}
 */

const removeUserSavedModel = async (IDs, user, Model) => {
  let modelName;
  let savedModel;
  /*istanbul ignore next*/
  if (Model === Track) {
    modelName = 'track';
    savedModel = savedTrack;
  } else {
    modelName = 'album';
    savedModel = savedAlbum;
  }
  const query = {};
  query[modelName] = {
    $in: IDs
  };
  query.user = user._id;
  const deletedDocs = await savedModel.deleteMany(query);
  if (deletedDocs.deletedCount == 0) {
    throw new AppError(`No ${modelName}s found with the given IDs`, 404);
  }
};
/*istanbul ignore next*/
exports.saveAlbumsForCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide album ids', 400));
  }
  const albumIds = req.query.ids.split(',');
  const savedAlbumDocs = await saveForCurrentUser(albumIds, Album, req.user);
  res.status(201).send(savedAlbumDocs);
});
/*istanbul ignore next*/
exports.saveTracksForCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide track ids', 400));
  }
  const trackIds = req.query.ids.split(',');
  const savedTrackDocs = await saveForCurrentUser(trackIds, Track, req.user);
  res.status(201).send(savedTrackDocs);
});
/*istanbul ignore next*/
exports.getSavedAlbums = catchAsync(async (req, res, next) => {
  const { limit, offset } = validateLimitOffset(
    req.query.limit,
    req.query.offset
  );
  const pagingObject = await getSavedModel(
    req.user,
    limit,
    offset,
    Album,
    req.url
  );
  res.status(200).json(pagingObject);
});
/*istanbul ignore next*/
exports.getSavedTracks = catchAsync(async (req, res, next) => {
  const { limit, offset } = validateLimitOffset(
    req.query.limit,
    req.query.offset
  );
  const pagingObject = await getSavedModel(
    req.user,
    limit,
    offset,
    Track,
    req.url
  );
  res.status(200).json(pagingObject);
});
/*istanbul ignore next*/
exports.checkUserSavedAlbums = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide albums ids', 400));
  }
  const albumIds = req.query.ids.split(',');
  const boolArray = await checkUsersSavedModel(albumIds, Album, req.user);
  res.status(200).json(boolArray);
});
/*istanbul ignore next*/
exports.checkUserSavedTracks = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide tracks ids', 400));
  }
  const trackIds = req.query.ids.split(',');
  const boolArray = await checkUsersSavedModel(trackIds, Track, req.user);
  res.status(200).json(boolArray);
});
/*istanbul ignore next*/
exports.removeUserSavedTrack = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide tracks ids', 400));
  }
  const trackIds = req.query.ids.split(',');
  await removeUserSavedModel(trackIds, req.user, Track);
  res.status(200).send();
});
/*istanbul ignore next*/
exports.removeUserSavedAlbum = catchAsync(async (req, res, next) => {
  if (!req.query.ids) {
    return next(new AppError('Please provide albums ids', 400));
  }
  const albumIds = req.query.ids.split(',');
  await removeUserSavedModel(albumIds, req.user, Album);
  res.status(200).send();
});

exports.saveForCurrentUserLogic = saveForCurrentUser;
exports.removeUserSavedModelLogic = removeUserSavedModel;
exports.checkUsersSavedModelLogic = checkUsersSavedModel;
exports.getSavedModelLogic = getSavedModel;
exports.getNextAndPrevious = getNextAndPrevious;

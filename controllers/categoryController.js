/**
 * Category Controller
 * @module CategoryController
 */
const mongoose = require('mongoose');
const Category = require('./../models/categoryModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');
const uploadAWSImage = require('../utils/uploadAWSImage');
const Playlist = require('./../models/playlistModel');
/**
 * A method that thakes the id of the category and returns a category object
 * @param {String} categoryId - The id of the category
 * @returns {Category} - The category with this id
 */
const getCategory = async categoryId => {
  const category = await Category.findById(categoryId).populate('playlists');
  if (!category) throw new AppError('No category found for this id', 404);
  return category;
};
exports.getCategoryLogic = getCategory;

/**
 * A method that returns all the categories, it can take optional param query params to limit the returned categories
 * @param {Object} [queryParams] - the query params to limit or set the offset of the response
 * @returns {Array<Category>} - Returns array of the categories
 */
const getAllCategories = async queryParams => {
  const features = new ApiFeatures(Category.find(), queryParams).skip();

  const categories = await features.query.populate('playlists');
  return categories;
};
exports.getAllCategoriesLogic = getAllCategories;
/**
 * Takes a category object {@link Category}, add it and return the newly added category
 * @param {Category} newCategory  - The new catrgory to be added. See {@link Category}
 * @returns {Category} - The newly added category
 */
const addCategory = async newCategory => {
  const category = await Category.create(newCategory);
  return category;
};
exports.addCategoryLogic = addCategory;

/**
 * Takes category id and returns array of playlists in this category, it can take optional param queryParams to limit the returned playlists
 * @param {String} categoryId - The id of the category to get its playlists
 * @param {Object} [queryParams] - the query params to limit or set the offset of the response
 */
const getCategoryPlaylists = async (categoryId, queryParams) => {
  const features = new ApiFeatures(
    Category.findById(categoryId).select('playlists'),
    queryParams
  ).skip();
  const {
    playlists
  } = await features.query.populate('playlists');
  return playlists;
};
exports.getCategoryPlaylistsLogic = getCategoryPlaylists;

const addPlaylistsToCategory = async (categoryId, playlistsIds) => {
  if (
    !categoryId ||
    !playlistsIds ||
    !Array.isArray(playlistsIds) ||
    playlistsIds.length === 0
  )
    throw new AppError('Invalid request sent', 400);

  categoryId = mongoose.Types.ObjectId(categoryId);

  const category = await Category.find({
    _id: categoryId
  }, {
    _id: 1
  }).limit(
    1
  );

  if (!category || category.length === 0)
    throw new AppError('No category found with that id', 404);

  const playlists = (
    await Playlist.find({
      _id: {
        $in: playlistsIds
      }
    }, {
      _id: 1
    })
  ).map(el => String(el._id));

  playlistsIds.forEach(playlistId => {
    if (!playlists.includes(playlistId))
      throw new AppError("One or more invalid playlist's ids");
  });

  const newCategory = await Category.findByIdAndUpdate(
    categoryId, {
      $push: {
        playlists: {
          $each: playlistsIds
        }
      }
    }, {
      new: true
    }
  );

  return newCategory;
};

const removePlaylistsFromCategory = async (categoryId, playlistIdsToRemove) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError("No category found with this id", 404);
  category.playlists = category.playlists.filter(playlistId => !playlistIdsToRemove.includes(playlistId.toString()));

  await category.save();
  return category;
};

const updateIcon = async (fileData, categoryId) => {
  if (!fileData) throw new AppError('Invalid file uploaded', 400);

  const category = await Category.findById(categoryId);

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
    'category',
    categoryId,
    dimensions,
    qualityNames
  );

  /*istanbul ignore next*/
  category.icons = imgObjects;
  /*istanbul ignore next*/
  await category.save();
};

/* istanbul ignore next */
exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await getCategory(req.params.id);
  res.status(200).json(category);
});

/* istanbul ignore next */
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await getAllCategories(req.query);
  res.status(200).json(categories);
});

/* istanbul ignore next */
exports.addCategory = catchAsync(async (req, res, next) => {
  const category = await addCategory(req.body);

  res.status(200).json(category);
});

/* istanbul ignore next */
exports.getCategoryPlaylists = catchAsync(async (req, res, next) => {
  const playlists = await getCategoryPlaylists(
    req.params.category_id,
    req.query
  );
  res.status(200).json(playlists);
});

/* istanbul ignore next */
exports.addPlaylistsToCategory = catchAsync(async (req, res, next) => {
  const category = await addPlaylistsToCategory(
    req.params.id,
    req.body.playlists
  );
  res.status(200).json(category);
});

/* istanbul ignore next */
exports.updateIcon = catchAsync(async (req, res, next) => {
  await updateIcon(req.files.image.data, req.params.id);
  res.status(202).json({
    status: 'success',
    message: 'Category icon updated successfully'
  });
});


/* istanbul ignore next */
exports.updateCategory = catchAsync(async (req, res, next) => {


  const updatedCategory = await Category.findByIdAndUpdate(req.params.id, {
    name: req.body.name
  }, {
    new: true
  });

  if (!updatedCategory) throw new AppError('No category with this id', 404);

  res.status(200).json({
    updatedCategory
  });
});

/* istanbul ignore next */
exports.deletePlaylists = catchAsync(async (req, res, next) => {
  const updatedCategory = await removePlaylistsFromCategory(req.params.id, req.body.playlists);

  res.status(200).json({
    category: updatedCategory
  });
});
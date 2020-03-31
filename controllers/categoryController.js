/**
 * Category Controller
 * @module CategoryController
 */

const Category = require('./../models/categoryModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');

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

exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await getCategory(req.params.id);
  res.status(200).json(category);
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await getAllCategories(req.query);
  res.status(200).json(categories);
});

exports.addCategory = catchAsync(async (req, res, next) => {
  const category = await addCategory(req.body);

  res.status(200).json(category);
});

exports.getCategoryPlaylists = catchAsync(async (req, res, next) => {
  const playlists = await getCategoryPlaylists(
    req.params.category_id,
    req.query
  );
  res.status(200).json(playlists);
});
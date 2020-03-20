const Category = require("./../models/categoryModel");
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');

exports.getCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) throw new AppError("No category found for this id", 404);

    res.status(200).json({
        status: "success",
        data: {
            category
        }
    });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {

    const features = new ApiFeatures(
        Category.find(),
        req.query
    ).skip();

    const categories = await features.query;


    res.status(200).json({
        status: "success",
        data: {
            categories
        }
    });
});

exports.addCategory = catchAsync(async (req, res, next) => {
    const category = await Category.create(req.body);

    res.status(200).json({
        status: "success",
        data: {
            category
        }
    });
});

exports.getCategoryPlaylists = catchAsync(async (req, res, next) => {
    const features = new ApiFeatures(Category.findById(req.params.category_id), req.query).skip();

    features.query = features.query.populate('playlists');

    const {
        playlists
    } = await features.query;

    res.status(200).json(playlists);
});
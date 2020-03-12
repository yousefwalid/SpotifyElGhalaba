const Category = require("./../models/categoryModel");
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

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
    const categories = await Category.find();

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
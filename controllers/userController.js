const User = require("./../models/userModel");
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    res.status(200).json({
        status: "success",
        data: {
            user
        }
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).select("name followers images type");

    if (!user) throw new AppError("No user is found with this id", 404);

    res.status(200).json({
        status: "success",
        data: {
            user
        }
    });
});
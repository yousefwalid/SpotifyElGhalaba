const User = require("./../models/userModel");
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

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

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) throw new AppError("This endpoint is not for updating passwords", 400);

    const updatedData = filterObj(req.body, 'name');

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updatedData, {
        new: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});
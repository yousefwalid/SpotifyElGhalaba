const Album = require("./../models/albumModel");
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');


exports.getNewReleases = catchAsync(async (req, res, next) => {
    const albums = await Album.find();
    res.status(200).json({
        status: 'success',
        data: {
            albums
        }
    });
});
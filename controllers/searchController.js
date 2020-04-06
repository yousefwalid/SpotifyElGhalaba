const {
    MongooseQueryParser
} = require('mongoose-query-parser');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');

//models
const Album = require('./../models/albumModel');
const Artist = require('./../models/artistModel');
const Playlist = require('./../models/playlistModel');
const Track = require('./../models/trackModel');
const User = require('./../models/userModel');

const parser = new MongooseQueryParser();

exports.search = catchAsync(async (req, res, next) => {
    const example = parser.parse(req.query);

    const queryString = req.query.q;
    const regex = new RegExp(`\\b${queryString.split('OR').join('|')}\\b`, 'i');

    const albums = await Album.find({
        name: {
            '$regex': regex
        }
    });

    const users = await User.find({
        name: {
            '$regex': regex
        }
    });

    res.status(200).json({
        albums,
        users
    });
});
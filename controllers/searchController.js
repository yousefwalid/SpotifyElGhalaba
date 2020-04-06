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
    const now = Date.now();
    const queryString = req.query.q;
    // const regex = new RegExp(`\\b${queryString.split('OR').join('|')}\\b`, 'i');
    let regex;
    //to check the exact word

    if (queryString.startsWith(`"`)) {
        regex = new RegExp(`^.*?(?:${queryString.slice(1, queryString.length-1)}).*$`, 'i')
    } else if (queryString.includes("OR")) {
        const queryStringFiltered = queryString.split("OR").map(word => word.trim()).join('|');
        regex = new RegExp(`^(?!.*?${queryStringFiltered[1]}).*?${queryStringFiltered[0]}.*$`, 'i');
    } else if (queryString.includes("NOT")) {
        const queryStringFiltered = queryString.split("NOT").map(word => word.trim());
        regex = new RegExp(`^(?!.*?${queryStringFiltered[1]}).*?${queryStringFiltered[0]}.*$`, 'i');
    } else {
        const filteredWords = queryString.split('').map(word => word.trim());

        let regexExpression = "";

        filteredWords.forEach(word => {
            regexExpression += `(?=.*${word})`;
        });

        regex = new RegExp(regexExpression, 'i');
    }



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
    console.log(Date.now() - now);
    res.status(200).json({
        albums,
        users
    });
});
const { MongooseQueryParser } = require('mongoose-query-parser');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');

//models
const Album = require('./../models/albumModel');
const Artist = require('./../models/artistModel');
const Playlist = require('./../models/playlistModel');
const Track = require('./../models/trackModel');
const User = require('./../models/userModel');

const getAlbums = async regex => {
  return await Album.find({
    name: {
      $regex: regex
    }
  });
};

const getUsers = async regex => {
  return await User.find({
    name: {
      $regex: regex
    }
  });
};

const getArtists = async regex => {
  return await Artist.find({
    name: {
      $regex: regex
    }
  });
};

const getPlaylists = async regex => {
  return await Playlist.find({
    name: {
      $regex: regex
    }
  });
};

const getTracks = async regex => {
  return await Track.find({
    name: {
      $regex: regex
    }
  });
};

exports.search = catchAsync(async (req, res, next) => {
  const queryString = req.query.q;
  const types = req.query.type
    ? req.query.type.split(',')
    : ['album', 'user', 'artist', 'playlist', 'track'];
  // const regex = new RegExp(`\\b${queryString.split('OR').join('|')}\\b`, 'i');
  let regex;
  //to check the exact word

  if (queryString.startsWith(`"`)) {
    regex = new RegExp(
      `^.*?(?:${queryString.slice(1, queryString.length - 1)}).*$`,
      'i'
    );
  } else if (queryString.includes('OR')) {
    const queryStringFiltered = queryString
      .split('OR')
      .map(word => word.trim())
      .join('|');
    regex = new RegExp(
      `^(?!.*?${queryStringFiltered[1]}).*?${queryStringFiltered[0]}.*$`,
      'i'
    );
  } else if (queryString.includes('NOT')) {
    const queryStringFiltered = queryString
      .split('NOT')
      .map(word => word.trim());
    regex = new RegExp(
      `^(?!.*?${queryStringFiltered[1]}).*?${queryStringFiltered[0]}.*$`,
      'i'
    );
  } else {
    const filteredWords = queryString.split('').map(word => word.trim());
    let regexExpression = '';
    filteredWords.forEach(word => {
      regexExpression += `(?=.*${word})`;
    });
    regex = new RegExp(regexExpression, 'i');
  }

  const getResultsFns = [];
  if (types.includes('album')) getResultsFns.push(getAlbums(regex));
  if (types.includes('user')) getResultsFns.push(getUsers(regex));
  if (types.includes('artist')) getResultsFns.push(getArtists(regex));
  if (types.includes('playlist')) getResultsFns.push(getPlaylists(regex));
  if (types.includes('track')) getResultsFns.push(getTracks(regex));

  const returnedDataArr = await Promise.all(getResultsFns);

  const returnedDataObj = {};
  types.forEach((type, index) => {
    returnedDataObj[`${type}s`] = returnedDataArr[index];
  });

  res.status(200).json(returnedDataObj);
});

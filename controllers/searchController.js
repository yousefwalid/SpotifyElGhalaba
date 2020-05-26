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

const getAlbums = async (regex, queryParams) => {
  const features = new ApiFeatures(
    Album.find({
      name: {
        $regex: regex
      }
    }),
    queryParams
  ).skip();

  return await features.query;

};

const getUsers = async (regex, queryParams) => {
  const features = new ApiFeatures(
    User.find({
      name: {
        $regex: regex
      },
      type: "user"
    }),
    queryParams
  ).skip();

  return await features.query;
};

const getArtists = async (regex, queryParams) => {
  const features = new ApiFeatures(
    User.find({
      name: {
        $regex: regex
      },
      type: "artist"
    }),
    queryParams
  ).skip();

  return await features.query;

};

const getPlaylists = async (regex, queryParams) => {
  const features = new ApiFeatures(
    Playlist.find({
      name: {
        $regex: regex
      }
    }),
    queryParams
  ).skip();

  return await features.query;
};

const getTracks = async (regex, queryParams) => {
  const features = new ApiFeatures(
    Track.find({
      name: {
        $regex: regex
      }
    }),
    queryParams
  ).skip();

  return await features.query;
};

exports.search = catchAsync(async (req, res, next) => {
  const queryString = req.query.q;
  const types = req.query.type ?
    req.query.type.split(',') : ['album', 'user', 'artist', 'playlist', 'track'];
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
    const filteredWords = queryString.split(' ').map(word => word.trim());
    let regexExpression = '';
    filteredWords.forEach(word => {
      regexExpression += `(?=.*${word})`;
    });
    regex = new RegExp(regexExpression, 'i');
  }

  const response = {};
  if (types.includes('album')) response.albums = await getAlbums(regex, req.query);
  if (types.includes('user')) response.users = await getUsers(regex, req.query);
  if (types.includes('artist')) response.artists = await getArtists(regex, req.query);
  if (types.includes('playlist')) response.playlists = await getPlaylists(regex, req.query);
  if (types.includes('track')) response.tracks = await getTracks(regex, req.query);

  res.status(200).json(response);
});
const Album = require('./../models/albumModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const filterDoc = require('./../utils/filterDocument');
const imageObject = require('./../models/objects/imageObject');
const multer = require('multer');
const sharp = require('sharp');

exports.getArtist = catchAsync(async (req, res, next) => {
  const artist = await Artist.findById(req.params.id);

  if (!artist) return next(new AppError('No artist found with that id', 404));

  req.status(200).json(artist);
});

exports.getMultipleArtists = catchAsync(async (req, res, next) => {
  const artists = await Artist.find({ _id: { $in: req.params.ids } });

  if (!artists) return next(new AppError('No artists found', 404));

  req.status(200).json(artists);
});

exports.getArtistAlbums = catchAsync(async (req, res, next) => {
  const albums = await Artist.findById(req.params.id).select('albums');

  req.status(200).json(albums);
});

exports.getArtistTopTracks = catchAsync(async (req, res, next) => {});

exports.getArtistRelatedArtists = catchAsync(async (req, res, next) => {});

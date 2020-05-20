const mongoose = require('mongoose');
const AppError = require('./../utils/appError');
const catchAsync = require('../utils/catchAsync');
const playHistory = require('../models/playHistoryModel');
const savedTracks = require('../models/savedTrackModel');
const savedAlbums = require('../models/savedAlbumModel');

const getTracksListens = async (ids, period, startDate, endDate) => {
  const periodEnums = ['year', 'month', 'day'];

  if (!ids || !Array.isArray(ids))
    throw new AppError('Invalid ids parameter', 400);

  if (!periodEnums.includes(period))
    throw new AppError(
      'Invalid period specified, please specify one of the values: "year", "month", "day"',
      400
    );

  if (!startDate || !endDate)
    throw new AppError('Start date or End date not specified', 400);

  if (new Date(startDate) > new Date(endDate))
    throw new AppError('Start date cannot be later than end date', 400);

  for (let i = 0; i < ids.length; i += 1)
    ids[i] = mongoose.Types.ObjectId(ids[i]);

  const playHistoryStats = await playHistory.aggregate([
    {
      $match: {
        track: { $in: ids },
        played_at: { $gte: new Date(startDate), $lt: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: {
          trackId: '$track',
          year: { $year: '$played_at' },
          ...((period === 'month' || period === 'day') && {
            month: { $month: '$played_at' }
          }),
          ...(period === 'day' && { day: { $dayOfMonth: '$played_at' } })
        },
        played: {
          $sum: 1
        }
      }
    }
  ]);

  return playHistoryStats;
};

const getTracksLikes = async (ids, period, startDate, endDate) => {
  const periodEnums = ['year', 'month', 'day'];

  if (!ids || !Array.isArray(ids))
    throw new AppError('Invalid ids parameter', 400);

  if (!periodEnums.includes(period))
    throw new AppError(
      'Invalid period specified, please specify one of the values: "year", "month", "day"',
      400
    );

  if (!startDate || !endDate)
    throw new AppError('Start date or End date not specified', 400);

  if (new Date(startDate) > new Date(endDate))
    throw new AppError('Start date cannot be later than end date', 400);

  for (let i = 0; i < ids.length; i += 1)
    ids[i] = mongoose.Types.ObjectId(ids[i]);

  const likeHistoryStats = await savedTracks.aggregate([
    {
      $match: {
        track: { $in: ids },
        added_at: { $gte: new Date(startDate), $lt: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: {
          trackId: '$track',
          year: { $year: '$added_at' },
          ...((period === 'month' || period === 'day') && {
            month: { $month: '$added_at' }
          }),
          ...(period === 'day' && { day: { $dayOfMonth: '$added_at' } })
        },
        liked: {
          $sum: 1
        }
      }
    }
  ]);

  return likeHistoryStats;
};

const getAlbumsListens = async (ids, period, startDate, endDate) => {
  const periodEnums = ['year', 'month', 'day'];

  if (!ids || !Array.isArray(ids))
    throw new AppError('Invalid ids parameter', 400);

  if (!periodEnums.includes(period))
    throw new AppError(
      'Invalid period specified, please specify one of the values: "year", "month", "day"',
      400
    );

  if (!startDate || !endDate)
    throw new AppError('Start date or End date not specified', 400);

  if (new Date(startDate) > new Date(endDate))
    throw new AppError('Start date cannot be later than end date', 400);

  for (let i = 0; i < ids.length; i += 1)
    ids[i] = mongoose.Types.ObjectId(ids[i]);

  const playHistoryStats = await playHistory.aggregate([
    {
      $match: {
        played_at: { $gte: new Date(startDate), $lt: new Date(endDate) }
      }
    },
    {
      $lookup: {
        from: 'Tracks',
        localField: 'track',
        foreignField: '_id',
        as: 'album'
      }
    },
    {
      $project: {
        track: { $arrayElemAt: ['$album', 0] },
        played_at: 1
      }
    },
    {
      $project: {
        album: '$track.album',
        played_at: 1
      }
    },
    {
      $match: {
        album: { $in: ids }
      }
    },
    {
      $group: {
        _id: {
          albumId: '$album',
          year: { $year: '$played_at' },
          ...((period === 'month' || period === 'day') && {
            month: { $month: '$played_at' }
          }),
          ...(period === 'day' && { day: { $dayOfMonth: '$played_at' } })
        },
        played: {
          $sum: 1
        }
      }
    }
  ]);

  return playHistoryStats;
};

const getAlbumsLikes = async (ids, period, startDate, endDate) => {
  const periodEnums = ['year', 'month', 'day'];

  if (!ids || !Array.isArray(ids))
    throw new AppError('Invalid ids parameter', 400);

  if (!periodEnums.includes(period))
    throw new AppError(
      'Invalid period specified, please specify one of the values: "year", "month", "day"',
      400
    );

  if (!startDate || !endDate)
    throw new AppError('Start date or End date not specified', 400);

  if (new Date(startDate) > new Date(endDate))
    throw new AppError('Start date cannot be later than end date', 400);

  for (let i = 0; i < ids.length; i += 1)
    ids[i] = mongoose.Types.ObjectId(ids[i]);

  const likeHistoryStats = await savedAlbums.aggregate([
    {
      $match: {
        album: { $in: ids },
        added_at: { $gte: new Date(startDate), $lt: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: {
          albumId: '$album',
          year: { $year: '$added_at' },
          ...((period === 'month' || period === 'day') && {
            month: { $month: '$added_at' }
          }),
          ...(period === 'day' && { day: { $dayOfMonth: '$added_at' } })
        },
        liked: {
          $sum: 1
        }
      }
    }
  ]);

  return likeHistoryStats;
};

exports.getTracksListens = catchAsync(async (req, res, next) => {
  const values = await getTracksListens(
    req.body.ids,
    req.body.period,
    req.body.startDate,
    req.body.endDate
  );
  res.status(200).json(values);
});

exports.getTracksLikes = catchAsync(async (req, res, next) => {
  const values = await getTracksLikes(
    req.body.ids,
    req.body.period,
    req.body.startDate,
    req.body.endDate
  );
  res.status(200).json(values);
});

exports.getAlbumsListens = catchAsync(async (req, res, next) => {
  const values = await getAlbumsListens(
    req.body.ids,
    req.body.period,
    req.body.startDate,
    req.body.endDate
  );
  res.status(200).json(values);
});

exports.getAlbumsLikes = catchAsync(async (req, res, next) => {
  const values = await getAlbumsLikes(
    req.body.ids,
    req.body.period,
    req.body.startDate,
    req.body.endDate
  );
  res.status(200).json(values);
});

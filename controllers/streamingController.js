const path = require('path');
const multer = require('multer');
const fs = require('fs');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');

// FILE CONFIGURATION
const dirPath = path.join(__dirname, '/../tracks/');
const trackFieldName = 'track';

//MULTER CONFIGURATION
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, dirPath);
  },
  filename: function(req, file, cb) {
    if (!req.body.trackId) {
      cb(new AppError('Request Body must contain trackId', 400));
    }
    cb(null, req.body.trackId);
  }
});
const upload = multer({
  storage: storage,
  limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }
});

/**
 * GET /tracks/:trackId
 */
exports.downloadTrack = catchAsync(async (req, res, next) => {
  const filePath = path.join(dirPath, req.params.trackId);

  // await User.findByIdAndUpdate(req.user._id, {
  //   currentlyPlaying: { type: { track: req.params.trackId, time: 0 } }
  // });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const { range } = req.headers;
  let readStream;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    // const end =
    //   parts[1] && parseInt(parts[1], 10) < fileSize - 1
    //     ? parseInt(parts[1], 10)
    //     : fileSize - 1;

    let end;
    if (!parts[1]) end = ((16 * 10 ** 5) % fileSize) + start;
    else if (parseInt(parts[1], 10) < fileSize) end = parseInt(parts[1], 10);
    else
      return next(
        new AppError('The Requested Range Is Greater Than The File Size')
      );
    if (end >= fileSize) end = fileSize - 1;

    const chunksize = end - start + 1;

    readStream = fs.createReadStream(filePath, { start, end });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg'
    };
    res.writeHead(206, head);
    readStream.pipe(res);
  } else {
    readStream = fs.createReadStream(filePath);
    const head = {
      'Content-Length': `${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Type': 'audio/mpeg'
    };
    res.writeHead(200, head);
    readStream.pipe(res);
  }
  readStream.on('error', err => {
    return next(new AppError('An error occured during streaming', 500));
  });
  // readStream.on('close', () => {
  //   setTimeout(async () => {
  //     await User.findByIdAndUpdate(req.user._id, {
  //       currentlyPlaying: null
  //     });
  //   }, 5 * 60 * 1000);
  // });
});
/**
 * POST /tracks
 */
exports.uploadTrack = (req, res, next) => {
  upload.single(trackFieldName)(req, res, err => {
    if (err) {
      return next(new AppError('Upload Request Validation Failed', 400));
    }
    if (!req.body.trackId) {
      return next(new AppError('No trackId in request body', 400));
    }

    res.status(201).json({
      status: 'success',
      message: 'Track Uploaded successfully'
    });
  });
};

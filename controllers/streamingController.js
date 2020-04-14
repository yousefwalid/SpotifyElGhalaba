const AwsS3Api = require('./../utils/awsS3Api');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
// const User = require('./../models/userModel');

const trackPerfix = 'track-';
const trackFieldName = 'track';

//MULTER CONFIGURATION
//A function parameter for AWS S3-multer - No need for unittesting
/* istanbul ignore next */
const trackKey = function(req, file, cb) {
  if (!req.body.trackId) {
    cb(new AppError('Request Body must contain trackId', 400));
  }
  cb(null, `${trackPerfix}${req.body.trackId}`);
};
//A function parameter for AWS S3-multer - No need for unittesting
/* istanbul ignore next */
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an audio format', 400), false);
  }
};

/**
 *
 * @param {String} trackId Id of the track.
 * @returns {Object} Contains the filePath and the size of the track.
 */
//Uses aws-sdk module function - No need for unittesting
/* istanbul ignore next */
const getTrackInfo = async (awsObj, trackId) => {
  const headObj = await awsObj.getHeadObject(`${trackPerfix}${trackId}`);
  const fileSize = headObj.ContentLength;
  return {
    filePath: `${trackPerfix}${trackId}`,
    fileSize
  };
};

/**
 *
 * @param {String} range The range header as a string in the format: bytes=[start]-[end] Such that the 'start' and 'end' are integers.
 * @param {Number} fileSize The size of the file that this chunk belongs to.
 * @returns {Object}  The object contains the chunkSize, start, end as integer numbers.
 */
const getChunkInfo = (range, fileSize) => {
  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(start) || !/^\d+$/.test(parts[0]))
    throw new AppError('Could Not Parse The Range.');
  if (start >= fileSize) {
    throw new AppError('Invalid range start');
  }

  let end;
  if (!parts[1]) {
    // end = ((16 * 10 ** 5) % fileSize) + start;
    end = 16 * 10 ** 5 + start;
    if (end >= fileSize) end = fileSize - 1;
  } else {
    end = parseInt(parts[1], 10);
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(end) || !/^\d+$/.test(parts[1]))
      throw new AppError('Could Not Parse The Range.');
    if (start > end || end > fileSize) {
      throw new AppError('Invalid range end');
    }
  }

  const chunkSize = end - start + 1;

  return { chunkSize, start, end };
};
exports.getChunkInfo = getChunkInfo;
/**
 * Makes a readStream and pipes the stream to the response.
 * If you want to send a chunck of the track you must specify the chunckInfo parameter
 * @param {Object} res Response Object
 * @param {Object} trackInfo Contains track info (fileSize & filePath)
 * @param {Object} chunkInfo Optional: Contains chunck info (chunckSize, start, end)
 */
//Uses nodejs stream module functions - No need for unittesting
/* istanbul ignore next */
const streamTrack = (res, awsObj, trackInfo, chunkInfo) => {
  const { fileSize, filePath } = trackInfo;
  let readStream;
  const head = {
    'Accept-Ranges': 'bytes',
    'Content-Type': 'audio/mpeg'
  };
  let statusCode;
  if (!chunkInfo) {
    head['Content-Length'] = `${fileSize}`;
    readStream = awsObj.s3createReadStream(filePath);
    statusCode = 200;
  } else {
    const { chunkSize, start, end } = chunkInfo;
    head['Content-Length'] = `${chunkSize}`;
    head['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
    const Range = `bytes=${start}-${end}`;
    readStream = awsObj.s3createReadStream(filePath, Range);
    statusCode = 206;
  }

  res.writeHead(statusCode, head);
  try {
    const resStream = readStream.pipe(res);
    resStream.on('error', err => {
      let errMsg = '';
      resStream.end();
      if (process.env.NODE_ENV === 'development') {
        errMsg = err.message.toString();
      }
      throw new AppError(`An error occured during streaming: ${errMsg}`, 500);
    });
    resStream.on('close', () => {
      resStream.end();
    });
  } catch {
    if (readStream) readStream.end();
  }
};

/**
 * GET /tracks/:trackId
 */
//request handler - No need for unittesting
/* istanbul ignore next */
exports.downloadTrack = catchAsync(async (req, res, next) => {
  // console.log(req.socket);
  const awsObj = new AwsS3Api();

  const trackInfo = await getTrackInfo(awsObj, req.params.trackId);
  const { range } = req.headers;
  if (range) {
    const chunkInfo = getChunkInfo(range, trackInfo.fileSize);
    streamTrack(res, awsObj, trackInfo, chunkInfo);
  } else {
    try {
      streamTrack(res, awsObj, trackInfo);
    } catch (err) {
      res.status(500).send({ Error: 'ERROR!' });
    }
  }
});

/**
 * POST /tracks
 */
//request handler - No need for unittesting
/* istanbul ignore next */
exports.uploadTrack = catchAsync(async (req, res, next) => {
  //Setting up aws and multer.
  const awsObj = new AwsS3Api();
  const limits = { fields: 1, fileSize: 10e9, files: 1, parts: 2 };
  awsObj.setMulterStorage(null, null, null, trackKey);
  awsObj.setMulterUploadOptions({ fileFilter, limits });
  const upload = awsObj.getMulterUpload();
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
});

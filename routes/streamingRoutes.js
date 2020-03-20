const express = require('express');
const authenticationController = require('./../controllers/authenticationController');

const streamingRouter = express.Router();

const streamingController = require('./../controllers/streamingController');

streamingRouter.get(
  '/:trackId',
  //   authenticationController.protect,
  streamingController.downloadTrack
);
streamingRouter.post(
  '/',
  authenticationController.protect,
  streamingController.uploadTrack
);

module.exports = streamingRouter;

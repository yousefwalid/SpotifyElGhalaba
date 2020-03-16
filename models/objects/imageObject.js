const mongoose = require('mongoose');

const ImageObject = new mongoose.Schema(
  {
    width: {
      type: Number,
      required: [true, 'The image width is required.']
    },
    height: {
      type: Number,
      required: [true, 'The image height is required.']
    },
    url: {
      type: String,
      trim: true,
      required: [true, 'The url is required.']
    }
  },
  {
    id: false,
    _id: false,
    __v: false
  }
);

module.exports = ImageObject;

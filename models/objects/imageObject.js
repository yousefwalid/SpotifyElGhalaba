const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');

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
    },
    colors: {
      type: [String],
      required: false
    }
  },
  {
    id: false,
    _id: false,
    strict: 'throw'
  }
);

ImageObject.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});

module.exports = ImageObject;

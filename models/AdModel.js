const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const ImageObject = require('./objects/imageObject');
/**
 *
 * @typedef {object} AdObject
 * @property {String} adText - The text of the ad
 * @property {ImageObject} images - Cover art of the ad
 */
const adSchema = new mongoose.Schema(
  {
    adText: {
      type: String
    },
    images: {
      type: [ImageObject],
      default: null
    }
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    },
    strict: 'throw'
  }
);
adSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
adSchema.plugin(mongooseLeanVirtuals);

const Ad = mongoose.model('Ad', adSchema, 'Ads');
module.exports = Ad;

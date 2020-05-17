const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

/**
 * @typedef {object} SavedTrackObject
 * @property {Date} added_at - The date and time the album was saved
 * @property {TrackObject} track - The track ID
 * @property {UserObject} user - The user ID
 */
const savedTrackSchema = new mongoose.Schema(
  {
    added_at: {
      type: Date,
      required: [true, 'saved track must have added_at timestamp']
    },
    track: {
      type: mongoose.Schema.ObjectId,
      ref: 'Track',
      required: [true, 'saved track must reference a track']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: {
      virtuals: true,
      transform:/* istanbul ignore next */
       function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }, //show virtual properties when providing the data as JSON
    toObject: { virtuals: true }, //show virtual properties when providing the data as Objects
    strict: 'throw'
  }
);
/* istanbul ignore next */
savedTrackSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
/* istanbul ignore next */
savedTrackSchema.plugin(mongooseLeanVirtuals);

const SavedTrack = mongoose.model('SavedTrack', savedTrackSchema);
module.exports = SavedTrack;

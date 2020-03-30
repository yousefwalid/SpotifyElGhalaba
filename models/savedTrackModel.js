const mongoose = require('mongoose');
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
    }
  },
  {
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }, //show virtual properties when providing the data as JSON
    toObject: { virtuals: true } //show virtual properties when providing the data as Objects
  }
);
const SavedTrack = mongoose.model('SavedTrack', savedTrackSchema);
module.exports = SavedTrack;

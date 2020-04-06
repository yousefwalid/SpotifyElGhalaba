const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');

const PlaylistTrackObject = new mongoose.Schema(
  {
    added_at: Date,
    added_by: { type: mongoose.Schema.ObjectId, ref: 'User' },
    is_local: {
      type: Boolean,
      default: false
    },
    track: { type: mongoose.Schema.ObjectId, ref: 'Track' }
  },
  {
    strict: 'throw'
  }
);

PlaylistTrackObject.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});

PlaylistTrackObject.pre(/^find/, function() {
  this.populate('track');
});

module.exports = PlaylistTrackObject;

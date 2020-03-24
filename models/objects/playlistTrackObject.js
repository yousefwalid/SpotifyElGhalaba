const mongoose = require('mongoose');

const PlaylistTrackObject = new mongoose.Schema({
  added_at: Date,
  added_by: mongoose.Schema.ObjectId,
  is_local: {
    type: Boolean,
    default: false
  },
  track: { type: mongoose.Schema.ObjectId, ref: 'Track' }
});

PlaylistTrackObject.pre(/^find/, function() {
  this.populate('track');
});

module.exports = PlaylistTrackObject;

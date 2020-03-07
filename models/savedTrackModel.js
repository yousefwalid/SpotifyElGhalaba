const mongoose = require('mongoose');

const savedTrackSchema = new mongoose.Schema({
  added_at: {
    type: Date,
    required: [true, 'saved track must have added_at timestamp']
  },
  track: {
    type: mongoose.Schema.ObjectId,
    ref: 'Track',
    required: [true, 'saved track must reference a track']
  }
});
const SavedTrack = mongoose.model('SavedTrack', savedTrackSchema);
module.exports = SavedTrack;

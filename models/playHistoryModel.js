const mongoose = require('mongoose');
const ContextObject = require('./objects/contextObject');

const playHistorySchema = new mongoose.Schema(
  {
    track: {
      type: mongoose.Schema.ObjectId,
      ref: 'Track',
      required: [true, 'A playHistory must have a Track reference.']
    },
    played_at: {
      type: Date,
      required: [true, 'A play history must have a played_at timestamp']
    },
    context: ContextObject
  },

  {
    toJSON: { virtuals: true }, //show virtual properties when providing the data as JSON
    toObject: { virtuals: true } //show virtual properties when providing the data as Objects
  }
);

const PlayHistory = mongoose.model('PlayHistory', playHistorySchema);

module.exports = PlayHistory;

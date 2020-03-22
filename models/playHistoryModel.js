const idValidator = require('mongoose-id-validator');
const mongoose = require('mongoose');
const ContextObject = require('./objects/contextObject');

const playHistorySchema = new mongoose.Schema(
  {
    track: {
      type: mongoose.Schema.ObjectId,
      ref: 'Track',
      required: [true, 'A playHistory must have a Track reference.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A playHistory must have a User reference.']
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

playHistorySchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
const PlayHistory = mongoose.model('PlayHistory', playHistorySchema);

module.exports = PlayHistory;

const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
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
    context: ContextObject,
    created_at: {
      type: Date,
      default: Date.now()
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

playHistorySchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});

playHistorySchema.plugin(mongooseLeanVirtuals);

const PlayHistory = mongoose.model('PlayHistory', playHistorySchema);

module.exports = PlayHistory;

const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

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
    toObject: { virtuals: true }, //show virtual properties when providing the data as Objects
    strict: 'throw'
  }
);
savedTrackSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
savedTrackSchema.plugin(mongooseLeanVirtuals);

const SavedTrack = mongoose.model('SavedTrack', savedTrackSchema);
module.exports = SavedTrack;

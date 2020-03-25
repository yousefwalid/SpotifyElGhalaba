const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const savedAlbumSchema = new mongoose.Schema(
  {
    added_at: {
      type: Date,
      required: [true, 'saved album must have added_at timestamp']
    },
    album: {
      type: mongoose.Schema.ObjectId,
      ref: 'Album',
      required: true
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
savedAlbumSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
savedAlbumSchema.plugin(mongooseLeanVirtuals);

const SavedAlbum = mongoose.model('SavedAlbum', savedAlbumSchema);
module.exports = SavedAlbum;

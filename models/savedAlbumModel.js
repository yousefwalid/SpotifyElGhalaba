const mongoose = require('mongoose');
/**
 * @typedef {object} SavedAlbumObject
 * @property {Date} added_at - The date and time the album was saved
 * @property {AlbumObject} album - The album ID
 * @property {UserObject} user - The user ID
 */
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
    toObject: { virtuals: true } //show virtual properties when providing the data as Objects
  }
);
const SavedAlbum = mongoose.model('SavedAlbum', savedAlbumSchema);
module.exports = SavedAlbum;

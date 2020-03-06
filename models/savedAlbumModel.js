const mongoose = require('mongoose');

const savedAlbumSchema = new mongoose.Schema({
  added_at: {
    type: Date,
    required: [true, 'saved album must have added_at timestamp']
  },
  album: {
    type: mongoose.Schema.ObjectId,
    ref: 'Album'
  }
});
const SavedAlbum = mongoose.model('SavedAlbum', savedAlbumSchema);
module.exports = SavedAlbum;

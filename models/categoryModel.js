const mongoose = require('mongoose');
const ImageObject = require('./objects/imageObject');

const categoryModels = new mongoose.Schema({
  icons: {
    // Array containing this category's icons, in various sizes
    type: [ImageObject]
  },
  name: {
    // The name of this category
    type: String,
    required: [true, 'A category must have a name'],
    unique: true
  },
  playlists: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Playlist'
  }]
});

const Category = mongoose.model('Category', categoryModels);

module.exports = Category;
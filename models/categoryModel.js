const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const ImageObject = require('./objects/imageObject');

const categoryModels = new mongoose.Schema(
  {
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
    playlists: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Playlist',
        unique: true
      }
    ]
  },
  {
    strict: 'throw'
  }
);
categoryModels.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
categoryModels.plugin(mongooseLeanVirtuals);

const Category = mongoose.model('Category', categoryModels);

module.exports = Category;

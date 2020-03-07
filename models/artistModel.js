const mongoose = require('mongoose');
const ExternalUrlObject = require('./objects/externalUrlObject');
const ImageObject = require('./objects/imageObject');

const artistSchema = new mongoose.Schema({
  external_urls: {
    // Array of external URLs of this artist account
    type: [ExternalUrlObject]
  },
  followers: {
    // Array of user ids following this artist account
    type: [mongoose.Schema.ObjectId]
  },
  genres: {
    // Array of this artist's genres
    type: [String]
  },
  images: {
    // Array of this artist's images in various sizes
    type: [ImageObject]
  },
  name: {
    type: String,
    required: [true, 'An artist must have a name']
  }
});

artistSchema.virtual('popularity').get(function() {
  // To be implemented
  // value of the popularity of the artist
  // calculated from the popularity of the artist's tracks
  // takes values from 0 to 100
});

artistSchema.virtual('type').get(function() {
  return 'artist';
});

artistSchema.virtual('uri').get(function() {
  return `spotify:artist:${this._id}`;
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;

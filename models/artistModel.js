const mongoose = require('mongoose');
// const validator = require('validator');
const idValidator = require('mongoose-id-validator');
const ExternalUrlObject = require('./objects/externalUrlObject');
const ImageObject = require('./objects/imageObject');
const FollowersObject = require('./objects/followersObject');

const artistSchema = new mongoose.Schema({
  external_urls: {
    // Array of external URLs of this artist account
    type: [ExternalUrlObject],
    default: null
  },
  followers: {
    // Array of user ids following this artist account
    type: [FollowersObject],
    default: null
  },
  genres: [{
    // Array of this artist's genres
    type: String,
    trim: true,
    maxlength: 30,
    minlength: 2,
    default: null
  }],
  images: {
    type: [ImageObject],
    default: null
  },
  userInfo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, `The artist's user info has to be specifed`]
  },
  albums: {
    type: [mongoose.Schema.ObjectId],
    ref: 'Album'
  }
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

artistSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
artistSchema.pre();

// artistSchema.virtual('popularity').get(function() {
// To be implemented
// value of the popularity of the artist
// calculated from the popularity of the artist's tracks
// takes values from 0 to 100
// });

//Can be retrieved from the userInfo ==> populate
// artistSchema.virtual('type').get(function() {
//   return 'artist';
// });

artistSchema.virtual('uri').get(function () {
  return `spotify:artist:${this._id}`;
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;
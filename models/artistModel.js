const mongoose = require('mongoose');
// const validator = require('validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const idValidator = require('mongoose-id-validator');
const ExternalUrlObject = require('./objects/externalUrlObject');
const ImageObject = require('./objects/imageObject');
const FollowersObject = require('./objects/followersObject');
const User = require('./userModel');

const artistSchema = new mongoose.Schema(
  {
    external_urls: {
      // Array of external URLs of this artist account
      type: [ExternalUrlObject],
      default: null
    },
    followers: {
      // Array of user ids following this artist account
      type: FollowersObject,
      default: {
        href: null,
        total: 0
      }
    },
    genres: [
      {
        // Array of this artist's genres
        type: String,
        trim: true,
        maxlength: 30,
        minlength: 2,
        default: null
      }
    ],
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
    },
    biography: {
      type: String,
      trim: true,
      default: ''
    },
    created_at: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
      virtuals: true
    },
    toObject: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
      virtuals: true
    },
    strict: 'throw'
  }
);

artistSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});

artistSchema.plugin(mongooseLeanVirtuals);

artistSchema.virtual('uri').get(function() {
  return `spotify:artist:${this._id}`;
});

artistSchema.virtual('type').get(function() {
  return `artist`;
});

artistSchema.virtual('href').get(function() {
  return `https://api.spotify.com/v1/artists/${this.id}`;
});

artistSchema.pre(/^find/, async function(next) {
  this.populate({
    path: 'userInfo',
    select: User.publicUser()
  });
});

artistSchema.post(/^find/, async function(doc, next) {
  if (doc)
    if (doc.forEach) {
      doc.forEach(el => {
        el._doc.name = el.userInfo.name;
      });
    } else {
      doc._doc.name = doc.userInfo.name;
    }

  next();
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;

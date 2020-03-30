/**
 * The User Object
 * @typedef {Object} User
 * @property {String} name - The user name
 * @property {String} email - The user email
 * @property {String} gender - The user gender "m" or "f"
 * @property {String} country - The user country
 * @property {String} type - The role of the user "user" , "admin" or "artist"
 * @property {String} product - The account product "free" or "premium"
 * @property {Date} birthdate - The user birthdate
 * @property {String} password - The password of the user
 * @property {String} passwordConfirm - The password confirm of the user
 * @property {String} image - The avatar of the user
 * @property {Boolean} active - Boolean to define if user is active or not
 * @property {Object} currentlyPlaying - Object of the currently playing track
 * @property {Object} devices - Array of devices object
 * @property {Number} followers - The number of the followers
 * @property {Array} following - Array of followed users
 * @property {Array} followedPlaylists - Array of followed playlists
 */

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const idValidator = require('mongoose-id-validator');
const CurrentlyPlayingObject = require('./objects/currentlyPlayingObject');
const DeviceObject = require('./objects/deviceObject');
const ImageObject = require('./objects/imageObject');

const followedPlaylist = new mongoose.Schema({
  playlist: {
    type: mongoose.Schema.ObjectId,
    ref: 'Playlist'
  },
  public: Boolean
}, {
  _id: false,
  id: false,
  __v: false
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 30,
    minlength: 2,
    required: [true, 'Name of the user is required'],
    validate: {
      validator: function (v) {
        return /^[a-z ,.'-]+$/i.test(v);
      },
      message: 'Invalid Name'
    }
  },
  email: {
    type: String,
    trim: true,
    maxlength: 50,
    minlength: 5,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, //transform the emails to lowercase,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  gender: {
    type: String,
    enum: {
      values: ['m', 'f'],
      message: 'Invalid gender value. Please specify either m or f.'
    },
    required: [true, `You have to specify the current user's gender`]
  },
  country: {
    type: String,
    validate: [
      validator.isISO31661Alpha2,
      'Please enter a valid counrty code'
    ]
  },
  type: {
    type: String,
    required: [true, 'user type is required'],
    enum: {
      values: ['user', 'artist', 'admin'],
      message: 'Invalid type value. Please specify one of the three user types: user, artist or admin'
    },
    default: 'user'
  },
  product: {
    type: String,
    required: [true, 'user product is required'],
    enum: {
      values: ['free', 'premium'],
      message: 'Invalid product value. Please specify either free or premium.'
    },
    default: 'free'
  },
  birthdate: {
    type: Date,
    required: [true, "Please specify the user's birthdate"],
    validate: {
      validator: function (date) {
        const currentYear = new Date().getFullYear();
        const candidateYear = date.getFullYear();
        return (
          candidateYear <= currentYear && candidateYear >= currentYear - 100
        );
      },
      message: 'Invalid birthdate'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    maxlength: 64,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirmation is not true'],
    select: false,
    validate: {
      // this only works on SAVE and CREATE not UPDATE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  image: {
    type: ImageObject,
    default: null
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresAt: Date,
  active: {
    type: Boolean,
    default: false,
    select: false
  },
  //currently playing object contains : track ( track id ), time ( minutes and seconds ), device ( devi )
  currentlyPlaying: {
    type: CurrentlyPlayingObject,
    default: {
      track: null,
      timestamp: null
    }
  },
  devices: {
    type: [DeviceObject],
    default: null
  },
  followers: {
    type: Number,
    default: 0
  },
  following: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  followedPlaylists: [followedPlaylist]
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});
userSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});

userSchema.virtual('uri').get(function () {
  return `spotify:user:${this._id}`;
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  }
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/g, function (next) {
  this.find({
    active: {
      $ne: false
    }
  });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Check if password changed after the signing the jwt  token
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passChangedAttimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passChangedAttimeStamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('SHA256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
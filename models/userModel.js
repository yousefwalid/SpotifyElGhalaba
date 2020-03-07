const mongoose = require('mongoose');
const validator = require('validator');
const imageObject = require('./objects/imageObject');
const followersObject = require('./objects/followersObject');
const currentlyPlayingObject = require("./objects/currentlyPlayingObject");
const deviceObject = require('./objects/deviceObject');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name of the user is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, //transform the emails to lowercase,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  country: {
    type: String,
    validate: [validator.isISO31661Alpha2, 'Please enter a valid counrty code']
  },
  role: {
    type: String,
    required: [true, 'user role is required'],
    enum: ['user', 'artist', 'admin'],
    default: 'user',
    select: false
  },
  product: {
    type: String,
    required: [true, 'user product is required'],
    enum: ['free', 'premium'],
    default: 'free'
  },
  followers: followersObject,
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
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
  image: imageObject,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresAt: Date,
  //currently playing object contains : track ( track id ), time ( minutes and seconds ), device ( devi )
  currentlyPlaying: currentlyPlayingObject,
  devices: [deviceObject]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
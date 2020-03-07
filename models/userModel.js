// pconst crypto = require("crypto");
const mongoose = require('mongoose');
const validator = require('validator');
const ImageObject = require('./objects/imageObject');
// const bcrypt = require('bcryptjs');

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
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  image: {
    type: ImageObject,
    required: true
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresAt: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;

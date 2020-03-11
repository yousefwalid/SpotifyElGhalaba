const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const FollowersObject = require('./objects/followersObject');
const CurrentlyPlayingObject = require('./objects/currentlyPlayingObject');
const DeviceObject = require('./objects/deviceObject');
const ImageObject = require('./objects/imageObject');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 30,
      minlength: 2,
      required: [true, 'Name of the user is required'],
      validate: {
        validator: function(v) {
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
        message:
          'Invalid type value. Please specify one of the three user types: user, artist or admin'
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
    birthday: {
      type: Number,
      min: [1, 'Birthday min value is 1'],
      max: [31, 'Birthday max value is 31'],
      required: [true, "Please specify the user's birthday"]
    },
    birthmonth: {
      type: Number,
      min: [1, 'Birthday min value is 1'],
      max: [12, 'Birthday max value is 12'],
      required: [true, "Please specify the user's birthmonth"]
    },
    birthyear: {
      type: Number,
      validate: {
        validator: function(y) {
          const currentYear = new Date().getFullYear();
          return y <= currentYear && y >= currentYear - 100;
        },
        message: 'Invalid birthyear'
      },
      required: [true, "Please specify the user's birthyear"]
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
        validator: function(el) {
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
      default: true,
      select: false
    },
    //currently playing object contains : track ( track id ), time ( minutes and seconds ), device ( devi )
    currentlyPlaying: {
      type: CurrentlyPlayingObject,
      default: null
    },
    devices: {
      type: [DeviceObject],
      default: null
    },
    followers: {
      type: FollowersObject,
      default: null
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/*
 ##     ##  #######  ########  ######## ##          ##     ##  #######   #######  ##    ##  ######  
 ###   ### ##     ## ##     ## ##       ##          ##     ## ##     ## ##     ## ##   ##  ##    ## 
 #### #### ##     ## ##     ## ##       ##          ##     ## ##     ## ##     ## ##  ##   ##       
 ## ### ## ##     ## ##     ## ######   ##          ######### ##     ## ##     ## #####     ######  
 ##     ## ##     ## ##     ## ##       ##          ##     ## ##     ## ##     ## ##  ##         ## 
 ##     ## ##     ## ##     ## ##       ##          ##     ## ##     ## ##     ## ##   ##  ##    ## 
 ##     ##  #######  ########  ######## ########    ##     ##  #######   #######  ##    ##  ######  
*/

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  }
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/g, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

/*
 ##     ##  #######  ########  ######## ##          ##     ## ######## ######## ##     ##  #######  ########   ######  
 ###   ### ##     ## ##     ## ##       ##          ###   ### ##          ##    ##     ## ##     ## ##     ## ##    ## 
 #### #### ##     ## ##     ## ##       ##          #### #### ##          ##    ##     ## ##     ## ##     ## ##       
 ## ### ## ##     ## ##     ## ######   ##          ## ### ## ######      ##    ######### ##     ## ##     ##  ######  
 ##     ## ##     ## ##     ## ##       ##          ##     ## ##          ##    ##     ## ##     ## ##     ##       ## 
 ##     ## ##     ## ##     ## ##       ##          ##     ## ##          ##    ##     ## ##     ## ##     ## ##    ## 
 ##     ##  #######  ########  ######## ########    ##     ## ########    ##    ##     ##  #######  ########   ######  
*/

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Check if password changed after the signing the jwt  token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passChangedAttimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return passChangedAttimeStamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
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

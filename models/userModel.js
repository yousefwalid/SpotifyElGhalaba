/**
 * The User Object
 * @typedef {Object} User
 * @property {String} name - The user name
 * @property {String} email - The user email
 * @property {String} phoneNumber - The user email
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
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const CurrentlyPlayingObject = require('./objects/currentlyPlayingObject');
const DeviceObject = require('./objects/deviceObject');
const ImageObject = require('./objects/imageObject');
/*
 
  ######   ######  ##     ## ######## ##     ##    ###    
 ##    ## ##    ## ##     ## ##       ###   ###   ## ##   
 ##       ##       ##     ## ##       #### ####  ##   ##  
  ######  ##       ######### ######   ## ### ## ##     ## 
       ## ##       ##     ## ##       ##     ## ######### 
 ##    ## ##    ## ##     ## ##       ##     ## ##     ## 
  ######   ######  ##     ## ######## ##     ## ##     ## 
 
*/
const followedPlaylist = new mongoose.Schema(
  {
    playlist: {
      type: mongoose.Schema.ObjectId,
      ref: 'Playlist'
    }
  },
  {
    _id: false,
    id: false,
    __v: false
  }
);

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
    googleId: String,
    facebookId: String,
    phoneNumber: {
      type: String
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
    birthdate: {
      type: Date,
      required: [true, "Please specify the user's birthdate"],
      validate: {
        validator: function(date) {
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
      minlength: 8,
      maxlength: 64
      // select: false
    },
    passwordConfirm: {
      type: String,
      // select: false,
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
    online: {
      type: Boolean,
      default: false
    },
    active: {
      // The user's account is active --> not deleted
      type: Boolean,
      default: true
      // select: false
    },
    //currently playing object contains : track ( track id ), time ( minutes and seconds ), device ( devi )
    currentlyPlaying: {
      type: CurrentlyPlayingObject,
      default: {}
    },
    devices: {
      type: [DeviceObject],
      validate: [
        function arrayLimit(val) {
          return val.length <= 3;
        },
        '{PATH} exceeds the limit of 3'
      ],
      default: []
    },
    followers: {
      type: Number,
      default: 0
    },
    following: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    followedPlaylists: [followedPlaylist]
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    },
    strict: 'throw'
  }
);

/*
 
 ########  ##       ##     ##  ######   #### ##    ##  ######  
 ##     ## ##       ##     ## ##    ##   ##  ###   ## ##    ## 
 ##     ## ##       ##     ## ##         ##  ####  ## ##       
 ########  ##       ##     ## ##   ####  ##  ## ## ##  ######  
 ##        ##       ##     ## ##    ##   ##  ##  ####       ## 
 ##        ##       ##     ## ##    ##   ##  ##   ### ##    ## 
 ##        ########  #######   ######   #### ##    ##  ######  
 
*/

userSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
userSchema.plugin(mongooseLeanVirtuals);

userSchema.virtual('uri').get(function() {
  return `spotify:user:${this._id}`;
});

/*
 
 ##     ##  #######   #######  ##    ##  ######  
 ##     ## ##     ## ##     ## ##   ##  ##    ## 
 ##     ## ##     ## ##     ## ##  ##   ##       
 ######### ##     ## ##     ## #####     ######  
 ##     ## ##     ## ##     ## ##  ##         ## 
 ##     ## ##     ## ##     ## ##   ##  ##    ## 
 ##     ##  #######   #######  ##    ##  ######  
 
*/

//Always unsave passwordConfirm in DB.
// userSchema.pre('save', async function (next) {
//   this.passwordConfirm = undefined;
//   next();
// });

//If the password is modified set the last time changed at.
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    if (!this.isNew) this.passwordChangedAt = Date.now();
  }
  next();
});

//Always deselect active field from queries
userSchema.pre(/^find/g, function(next) {
  this.find({
    active: {
      $ne: false
    }
  });
  next();
});

/*
 
  ######  ########    ###    ######## ####  ######   ######  
 ##    ##    ##      ## ##      ##     ##  ##    ## ##    ## 
 ##          ##     ##   ##     ##     ##  ##       ##       
  ######     ##    ##     ##    ##     ##  ##        ######  
       ##    ##    #########    ##     ##  ##             ## 
 ##    ##    ##    ##     ##    ##     ##  ##    ## ##    ## 
  ######     ##    ##     ##    ##    ####  ######   ######  
 
*/

//Returns a select options object for private user
userSchema.statics.privateUser = () => {
  return {
    active: 0,
    __v: 0
  };
};

//Returns a select options object for public user
userSchema.statics.publicUser = () => {
  return {
    password: 0,
    passwordConfirm: 0,
    passwordChangedAt: 0,
    passwordResetToken: 0,
    passwordResetExpiresAt: 0,
    active: 0,
    __v: 0
  };
};

//Compares two passwords
userSchema.statics.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Check if password changed after signing the jwt  token
userSchema.statics.changedPasswordAfter = function(user, JWTTimestamp) {
  if (user.passwordChangedAt) {
    const passChangedAttimeStamp = user.passwordChangedAt.getTime();
    return passChangedAttimeStamp > JWTTimestamp * 1000;
  }
  return false;
};

/*
 ##     ## ######## ######## ##     ##  #######  ########   ######  
 ###   ### ##          ##    ##     ## ##     ## ##     ## ##    ## 
 #### #### ##          ##    ##     ## ##     ## ##     ## ##       
 ## ### ## ######      ##    ######### ##     ## ##     ##  ######  
 ##     ## ##          ##    ##     ## ##     ## ##     ##       ## 
 ##     ## ##          ##    ##     ## ##     ## ##     ## ##    ## 
 ##     ## ########    ##    ##     ##  #######  ########   ######  
*/

//Creates a hashed reset token and returns it.
userSchema.methods.createPasswordResetToken = async function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('SHA256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;
  await this.save({
    //To avoid the passwordConfirm field validation
    validateBeforeSave: false
  });
  return resetToken;
};

//Returns an object contains the public user info.
userSchema.methods.privateToPublic = function() {
  const publicUser = this.toObject({
    virtuals: true
  });
  const fieldsToExclude = userSchema.statics.publicUser();

  Object.keys(publicUser).forEach(el => {
    if (fieldsToExclude[el] === 0) {
      delete publicUser[el];
    }
  });
  return publicUser;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

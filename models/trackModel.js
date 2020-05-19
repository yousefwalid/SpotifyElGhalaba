const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const AppError = require('./../utils/appError');
const Album = require('./../models/albumModel');
const ExternalUrlObject = require('./objects/externalUrlObject');
/**
 *
 * @typedef {object} TrackObject
 * @property {AlbumObject} album - Album
 * @property {Array<ArtistObject>} artists - Artists who performed in the track
 * @property {Number} disc_number - The disc number
 * @property {Number} duration_ms - The track length in milliseconds
 * @property {ExternalUrlObject} external_urls - Known external URLS for this track
 * @property {Boolean} explicit - Whether or not the track has explicit lyrics
 * @property {String} name - The name of the track
 * @property {String} href - A link to the Web API endpoint providing full details of the track
 * @property {String} id - The Spotify ID for the track.
 * @property {Number} track_number - The number of the track. If an album has several discs, the track number is the number on the specified disc.
 * @property {type} type - The object type: "track"
 * @property {String} uri - The Spotify URI for the track
 */
const trackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A track must have a name.']
    },
    album: {
      type: mongoose.Schema.ObjectId,
      ref: 'Album',
      required: [true, 'A track must have an album reference.']
    },
    artists: {
      type: [
        {
          type: mongoose.Schema.ObjectId,
          ref: 'Artist'
        }
      ],
      required: [true, 'A track must have at least one artist reference']
    },
    disc_number: {
      type: Number,
      default: 1,
      min: [1, 'disc_number min value is 1']
    },
    duration_ms: {
      type: Number,
      min: [0, 'duration min value is 1ms']
    },
    explicit: {
      type: Boolean
    },
    external_urls: {
      type: [ExternalUrlObject]
    },
    track_number: {
      type: Number
    },
    played: {
      type: Number,
      default: 0
    },
    created_at: {
      type: Date,
      default: Date.now()
    },
    active: Boolean
  },

  {
    toJSON: {
      virtuals: true,
      transform:
        //This function is only called on sending the json response[no need for unittesting]
        /* istanbul ignore next */
        function(doc, ret) {
          ret.id = ret._id;
          delete ret._id;
        }
    }, //show virtual properties when providing the data as JSON
    /* istanbul ignore next */
    toObject: {
      virtuals: true
    }, //show virtual properties when providing the data as Objects
    strict: 'throw'
  }
);

/* istanbul ignore next */
trackSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
trackSchema.plugin(mongooseLeanVirtuals);

/* istanbul ignore next */
trackSchema.pre('save', async function(next) {
  const album = await Album.findById(this.album);
  this.track_number = album.tracks.length + 1;
  this.played = 0;
  this.active = true;
  next();
});

/* istanbul ignore next */
trackSchema.pre(/^find/,async function(next){
  this.where({active:true});
  next();
})
/* istanbul ignore next */
trackSchema.post('save', async function(doc, next) {
  const album = await Album.findById(this.album);
  album.tracks.push(this._id);
  await album.save();
  next();
});

const type = trackSchema.virtual('type');
/* istanbul ignore next */
type.get(function() {
  return 'track';
});

const URI = trackSchema.virtual('uri');
/* istanbul ignore next */
URI.get(function() {
  return `spotify:track:${this._id}`;
});
const href = trackSchema.virtual('href');
/* istanbul ignore next */
href.get(function() {
  return `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${process.env.API_VERSION}/tracks/${this._id}`;
});

const Track = mongoose.model('Track', trackSchema, 'Tracks');

module.exports = Track;

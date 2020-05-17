const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const ImageObject = require('./objects/imageObject');
const ExternalUrlObject = require('./objects/externalUrlObject');
const Artist = require('./artistModel');
const AppError = require('./../utils/appError');
/**
 *
 * @typedef {object} AlbumObject
 * @property {String} album_type - Album,Single,Compilation
 * @property {Array<ArtistObject>} artists - Artists of each album
 * @property {Array<String>} genres - List of album's genres
 * @property {ImageObject} images - Cover art of the album
 * @property {ExternalUrlObject} external_urls - Known external URLS for this album
 * @property {String} label - The label for the album
 * @property {String} name - The name of the album
 * @property {Number} popularity - The popularity of the album.The value will be between 0 and 100, with 100 being the most popular. The popularity is calculated from the popularity of the album’s individual tracks.
 * @property {Date} release_date - The date the album was first released
 * @property {Array<TrackObject>} tracks -The tracks of the album
 * @property {type} type - The object type: "Album"
 * @property {String} uri - The Spotify URI for the Album
 * @property {String} id - The Spotify ID for the Album.
 */
const albumSchema = new mongoose.Schema(
  {
    album_type: {
      type: String,
      required: [true, 'An album must have a type'],
      enum: {
        values: ['album', 'single', 'compilation'],
        message: 'album type is either: album, single or compilation'
      }
    },
    artists: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Artist'
      }
    ],
    genres: [
      {
        type: String
      }
    ],
    images: {
      type: [ImageObject],
      default: null
    },
    external_urls: {
      type: ExternalUrlObject
    },
    label: String,
    name: {
      type: String,
      required: [true, 'An album must have a name']
    },
    popularity: Number, //Calculated from popularity of individual tracks
    release_date: {
      type: Date,
      required: [true, 'An album must have a release date']
    },
    tracks: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Track'
      }
    ],
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
      /* istanbul ignore next */
      function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    },
    /* istanbul ignore next */
    toObject: {
      virtuals: true
    },
    strict: 'throw'
  }
);
/* istanbul ignore next */
albumSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
/* istanbul ignore next */
albumSchema.plugin(mongooseLeanVirtuals);
/* istanbul ignore next */
albumSchema.pre('save', async function(next) {
  this.active = true;
  this.wasNew = this.isNew;
  next();
});
/* istanbul ignore next */
albumSchema.pre(/^find/,async function(next){
  this.where({active:true});
  next();
});
/* istanbul ignore next */
albumSchema.post('save', async function(doc, next) {
  if (this.wasNew) {
    if (this.artists && this.artists.length > 0) {
      const artists = await Artist.find({ _id: { $in: this.artists } });

      if (!artists) next(new AppError('No artists found with these ids'));
      artists.forEach(artist => {
        if (!artist.albums.includes(this._id)) artist.albums.push(this._id);
        artist.save();
      });
    } else {
      throw new AppError('No artists specified in the request', 500);
    }
  }
  next();
});

const URI = albumSchema.virtual('uri');
/* istanbul ignore next */
URI.get(function() {
  return `spotify:track:${this._id}`;
});
const type = albumSchema.virtual('type');
/* istanbul ignore next */
type.get(function() {
  return 'album';
});
const href = albumSchema.virtual('href');
/* istanbul ignore next */
href.get(function() {
  return `${process.env.DOMAIN_PRODUCTION}${process.env.API_BASE_URL}/v${process.env.API_VERSION}/albums/${this._id}`;
});
const Album = mongoose.model('Album', albumSchema, 'Albums');
module.exports = Album;

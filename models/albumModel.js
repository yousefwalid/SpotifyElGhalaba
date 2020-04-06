const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const ImageObject = require('./objects/imageObject');
const ExternalUrlObject = require('./objects/externalUrlObject');
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
    ]
  },
  {
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    },
    toObject: {
      virtuals: true
    },
    strict: 'throw'
  }
);
albumSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
albumSchema.plugin(mongooseLeanVirtuals);

const URI = albumSchema.virtual('uri');
URI.get(function() {
  return `spotify:track:${this._id}`;
});
const type = albumSchema.virtual('type');
type.get(function() {
  return 'album';
});
const href = albumSchema.virtual('href');
href.get(function() {
  return `http://localhost:${process.env.PORT}/api/v1/albums/${this._id}`;
});
const Album = mongoose.model('Album', albumSchema, 'Albums');
module.exports = Album;

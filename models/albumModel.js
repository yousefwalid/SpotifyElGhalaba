const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const ImageObject = require('./objects/imageObject');
const ExternalUrlObject = require('./objects/externalUrlObject');

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
      // Contains the external URLs for the playlist
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
    toObject: { virtuals: true }
  }
);
albumSchema.plugin(idValidator, { message: 'Bad ID value for {PATH}' });

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
  return `http://localhost:${process.env.PORT}/v1/albums/${this._id}`;
});
const Album = mongoose.model('Album', albumSchema, 'Albums');
module.exports = Album;

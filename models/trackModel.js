const mongoose = require('mongoose');
const AppError = require('./../utils/appError');
const Album = require('./../models/albumModel');
// const ExternalIdObject = require("./objects/externalIdObject");
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
 * @property {String} name - The name of the album
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
      ]
      //required: [true, 'A track must have at least one artist reference']
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
    //   external_ids: {
    //     type: [ExternalIdObject]
    //   },
    external_urls: {
      type: [ExternalUrlObject]
    },
    //TODO: I have no idea what these properties are
    // linked_from: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: "TrackLink"
    // },
    // restrictions: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: "Restriction"
    // },
    // preview_url: {
    //   type: String
    // },
    track_number: {
      type: Number
    }
  },

  {
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }, //show virtual properties when providing the data as JSON
    toObject: { virtuals: true } //show virtual properties when providing the data as Objects
  }
);
trackSchema.pre('save', async function(next) {
  const album = await Album.findById(this.album);
  if (!album) {
    next(new AppError('No album found with this id', 404));
  }
  this.track_number = album.tracks.length + 1;
});
trackSchema.post('save', async function(next) {
  const album = await Album.findById(this.album);
  album.tracks.push(this._id);
  await album.save();
});
const type = trackSchema.virtual('type');
type.get(function() {
  return 'track';
});
const URI = trackSchema.virtual('uri');
URI.get(function() {
  return `spotify:track:${this._id}`;
});
const href = trackSchema.virtual('href');
href.get(function() {
  return `http://localhost:${process.env.PORT}/api/v1/tracks/${this._id}`;
});
const Track = mongoose.model('Track', trackSchema, 'Tracks');

module.exports = Track;

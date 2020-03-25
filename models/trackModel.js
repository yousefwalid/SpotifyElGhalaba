const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const AppError = require('./../utils/appError');
const Album = require('./../models/albumModel');
// const ExternalIdObject = require("./objects/externalIdObject");
const ExternalUrlObject = require('./objects/externalUrlObject');

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
    is_playable: {
      type: Boolean
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
    toObject: { virtuals: true }, //show virtual properties when providing the data as Objects
    strict: 'throw'
  }
);

trackSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
trackSchema.plugin(mongooseLeanVirtuals);

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

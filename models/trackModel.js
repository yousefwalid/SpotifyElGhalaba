const mongoose = require('mongoose');
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
    //   external_ids: {
    //     type: [ExternalIdObject]
    //   },
    external_urls: {
      type: [ExternalUrlObject]
    },
    href: {
      type: String
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
    },
    type: {
      type: String,
      default: 'track'
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

const URI = trackSchema.virtual('uri');
URI.get(function() {
  return `spotify:track:${this._id}`;
});

const Track = mongoose.model('Track', trackSchema, 'Tracks');

module.exports = Track;

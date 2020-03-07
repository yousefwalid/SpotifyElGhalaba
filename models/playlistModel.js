const mongoose = require('mongoose');
const ExternalUrlObject = require('./objects/externalUrlObject');
const ImageObject = require('./objects/imageObject');

const playlistSchema = new mongoose.Schema({
  collaborative: {
    // Defines whether a playlist is collaborative or not
    type: Boolean,
    required: [true, 'A playlist collaboration must be specificed'],
    default: false
  },
  external_urls: {
    // Contains the external URLs for the playlist
    type: ExternalUrlObject
  },
  images: {
    // Array of images of the playlist
    type: [ImageObject],
    validate: {
      // A playlist can have up to 4 images
      // They must be of different albums and are sorted from greater to smaller
      validator: () => {
        return this.type.length <= 4;
      },
      message: "Can't have more than 4 images"
    }
  },
  name: {
    // The name of the playlist
    type: String,
    required: [true, 'A playlist must have a name']
  },
  description: {
    // Description of the playlist
    type: String
  },
  owner: {
    // The id of the owner (and creator) of the playlist
    type: mongoose.Schema.ObjectId,
    required: [true, 'A playlist must have an owner']
  },
  public: {
    // Whether a playlist is public to other people or not
    type: Boolean,
    default: true
  },
  tracks: {
    // Array of track ids that this playlist contains
    type: [mongoose.Schema.ObjectId]
  },
  collaborators: {
    // Array of collaborators of this playlist
    // It is empty if the playlist is not collaborative
    type: [mongoose.Schema.ObjectId],
    validate: {
      validator: () => {
        // Validates if the collaborators are empty when it is not collaborative
        if (this.collaborative === false && this.collaborators.length !== 0)
          return false;
      }
    }
  }
});

playlistSchema.virtual('type').get(function() {
  return 'Playlist';
});

playlistSchema.virtual('uri').get(function() {
  return `spotify:playlist:${this._id}`;
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;

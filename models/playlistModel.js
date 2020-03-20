const mongoose = require('mongoose');
const ExternalUrlObject = require('./objects/externalUrlObject');
const ImageObject = require('./objects/imageObject');
const PlaylistTrackObject = require('./objects/playlistTrackObject');

const playlistSchema = new mongoose.Schema({
  collaborative: {
    // Defines whether a playlist is collaborative or not
    type: Boolean,
    default: false
  },
  description: {
    // Description of the playlist
    type: String
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
        return this.images == null || this.images.length <= 4;
      },
      message: "Can't have more than 4 images"
    }
  },
  name: {
    // The name of the playlist
    type: String,
    required: [true, 'A playlist must have a name']
  },
  owner: {
    // The id of the owner (and creator) of the playlist
    /**
     * @todo Add PublicUserObject instead of ObjectId
     */
    type: mongoose.Schema.ObjectId
    //,required: [true, 'A playlist must have an owner']
  },
  public: {
    // Whether a playlist is public to other people or not
    type: Boolean,
    default: true
  },
  followers: {
    type: Number,
    default: 0
  },
  // Array of track ids that this playlist contains
  tracks: {
    items: [PlaylistTrackObject]
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
}, {
  // properties object
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    }
  },
  toObject: {
    virtuals: true
  },
  versionKey: false
});

playlistSchema.virtual('type').get(function () {
  return 'playlist';
});

playlistSchema.virtual('uri').get(function () {
  return `spotify:playlist:${this.id}`;
});

playlistSchema.virtual('href').get(function () {
  return `https://api.spotify.com/v1/users/spotify/playlists/${this.id}`;
});

playlistSchema.virtual('tracks.href').get(function () {
  return `https://api.spotify.com/v1/users/spotify/playlists/${this.id}/tracks`;
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
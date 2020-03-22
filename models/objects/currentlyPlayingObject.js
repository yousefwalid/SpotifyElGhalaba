const mongoose = require('mongoose');
const DeviceObject = require('./deviceObject');

const CurrentlyPlayingObject = new mongoose.Schema(
  {
    track: {
      type: mongoose.Schema.ObjectId,
      ref: 'Track',
      default: null
    },
    timestamp: {
      //The timestamp at which the user started the currently playing track
      type: Date,
      default: null
    },
    repeat_state: {
      type: Boolean,
      default: false
    },
    shuffle_state: {
      type: Boolean,
      default: false
    },
    volume_percent: {
      type: Number,
      default: 60
    },
    is_playing: {
      type: Boolean,
      default: false
    },
    progress_ms: {
      //number of seconds from the begining of the song
      type: Number,
      default: 0
    },
    device: DeviceObject
  },
  {
    _id: false,
    id: false,
    __v: false
  }
);

module.exports = CurrentlyPlayingObject;

const mongoose = require('mongoose');
const DeviceObject = require('./deviceObject');

const CurrentlyPlayingObject = new mongoose.Schema(
  {
    track: {
      type: mongoose.Schema.ObjectId,
      ref: 'Track'
    },
    time: Number, //number of seconds from the begining of the song
    device: DeviceObject
  },
  {
    _id: false,
    id: false,
    __v: false
  }
);

module.exports = CurrentlyPlayingObject;

const mongoose = require("mongoose");
const deviceObject = require("./deviceObject");

const currentlyPlayingObject = {
    track: {
        type: mongoose.Schema.ObjectId,
        ref: 'Track'
    },
    time: Number, //number of seconds from the begining of the song
    device: deviceObject
};

module.exports = currentlyPlayingObject;
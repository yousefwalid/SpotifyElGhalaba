const mongoose = require('mongoose');
const ImageObject = require('./objects/imageObject');
//external ids, external urls,type
const albumSchema = new mongoose.Schema({
  album_type: {
    type: String,
    required: [true, 'An album must have a type'],
    enum: {
      values: ['album', 'single', 'compilation'],
      message: 'album type is either: album, single or compilation'
    },
    artists: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Artist'
      }
    ]
  },
  genres: [
    {
      type: String
    }
  ],
  images: [
    {
      type: ImageObject,
      required: true
    }
  ],
  href: String,
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
  release_date_precision: {
    type: String,
    enum: {
      values: ['year', 'month', 'day'],
      message: 'date precision values must be year,month or day'
    }
  },
  tracks: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Track'
    }
  ],
  uri: String
});

const Album = mongoose.model('Album', albumSchema);
module.exports = Album;

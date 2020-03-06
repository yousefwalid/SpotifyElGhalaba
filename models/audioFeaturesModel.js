const mongoose = require('mongoose');

const audioFeaturesSchema = new mongoose.Schema({
  acousticness: {
    type: Number,
    min: [0, 'acousticness must be between 0 and 1'],
    max: [1, 'acousticness must be between 0 and 1']
  },
  danceability: {
    type: Number,
    min: [0, 'danceability must be between 0 and 1'],
    max: [1, 'danceability must be between 0 and 1']
  },
  duration_ms: Number,
  energy: {
    type: Number,
    min: [0, 'energy must be between 0 and 1'],
    max: [1, 'energy must be between 0 and 1']
  },
  id: {
    type: mongoose.Schema.ObjectId,
    ref: 'Track'
  },
  instrumentalness: {
    type: Number,
    min: [0, 'instrumentalness must be between 0 and 1'],
    max: [1, 'instrumentalness must be between 0 and 1']
  },
  key: Number,
  liveness: {
    type: Number,
    min: [0, 'liveness must be between 0 and 1'],
    max: [1, 'liveness must be between 0 and 1']
  },
  loudness: {
    type: Number,
    min: [-60, 'loudness must be between -60 and 0 db'],
    max: [0, 'loudness must be between -60 and 0 db']
  },
  mode: {
    type: Number,
    min: [0, 'mode must be between 0 and 1'],
    max: [1, 'mode must be between 0 and 1']
  },
  speechiness: {
    type: Number,
    min: [0, 'speechiness must be between 0 and 1'],
    max: [1, 'speechiness must be between 0 and 1']
  },
  tempo: Number,
  time_signature: Number,
  track_href: String,
  uri: String,
  valence: {
    type: Number,
    min: [0, 'valence must be between 0 and 1'],
    max: [1, 'valence must be between 0 and 1']
  }
});

const AudioFeatures = mongoose.model('AudioFeatures', audioFeaturesSchema);
module.exports = AudioFeatures;

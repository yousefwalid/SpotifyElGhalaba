const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const audioFeaturesSchema = new mongoose.Schema(
  {
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
    track: {
      type: mongoose.Schema.ObjectId,
      ref: 'Track',
      unique: true
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
    valence: {
      type: Number,
      min: [0, 'valence must be between 0 and 1'],
      max: [1, 'valence must be between 0 and 1']
    }
  },
  {
    toJSON: {
      virtuals: true
    }, //show virtual properties when providing the data as JSON
    toObject: { virtuals: true }, //show virtual properties when providing the data as Objects
    strict: 'throw'
  }
);
audioFeaturesSchema.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
audioFeaturesSchema.plugin(mongooseLeanVirtuals);

const type = audioFeaturesSchema.virtual('type');
type.get(function() {
  return 'audio_features';
});
const AudioFeatures = mongoose.model('AudioFeatures', audioFeaturesSchema);
module.exports = AudioFeatures;

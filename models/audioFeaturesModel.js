const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

/**
 * @typedef {object} AudioFeaturesObject
 * @property {Number} acousticness -A confidence measure from 0.0 to 1.0 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.
 * @property {Number} danceability -Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. A value of 0.0 is least danceable and 1.0 is most danceable.
 * @property {Number} duration_ms -The duration of the track in milliseconds.
 * @property {Number} energy -Energy is a measure from 0.0 to 1.0 and represents a perceptual measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy.
 * @property {TrackID} track -The Spotify ID for the track.
 * @property {Number} instrumentalness -Predicts whether a track contains no vocals. “Ooh” and “aah” sounds are treated as instrumental in this context. Rap or spoken word tracks are clearly “vocal”. The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content. Values above 0.5 are intended to represent instrumental tracks, but confidence is higher as the value approaches 1.0.
 * @property {Number} key -The key the track is in. Integers map to pitches using standard Pitch Class notation . E.g. 0 = C, 1 = C♯/D♭, 2 = D, and so on.
 * @property {Number} liveness -Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 provides strong likelihood that the track is live.
 * @property {Number} loudness -The overall loudness of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness is the quality of a sound that is the primary psychological correlate of physical strength (amplitude). Values typical range between -60 and 0 db.
 * @property {Number} mode -Mode indicates the modality (major or minor) of a track, the type of scale from which its melodic content is derived. Major is represented by 1 and minor is 0.
 * @property {Number} speechiness -Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value. Values above 0.66 describe tracks that are probably made entirely of spoken words. Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.
 * @property {Number} tempo -The overall estimated tempo of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration.
 * @property {Number} time_signature -An estimated overall time signature of a track. The time signature (meter) is a notational convention to specify how many beats are in each bar (or measure).
 * @property {Number} valence -A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).
 */
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
    },
    created_at: {
      type: Date,
      default: Date.now()
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

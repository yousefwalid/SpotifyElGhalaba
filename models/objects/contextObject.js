const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');
const ExternalUrlObject = require('./externalUrlObject');

const ContextObject = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      required: [true, 'A context object has to have a type.']
    },
    href: {
      type: String,
      trim: true,
      required: [true, 'A context object has to have an href.']
    },
    external_urls: {
      type: [ExternalUrlObject]
    }
  },
  {
    id: false,
    _id: false,
    strict: 'throw'
  }
);
ContextObject.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
module.exports = ContextObject;

//Two level embedding
/*
const Track = require('./models/trackModel');
const PlayHistory = require('./models/playHistoryModel');

app.route('/api/v1/playHistory').get(async (req, res, next) => {
  const track = await Track.findOne({ name: 'track1' });
  const externalUrls = [
    { a: 'spotify', b: 'spotify' },
    { a: 'spotify', b: 'spotify' },
    { a: 'spotify', b: 'spotify' }
  ];
  const context = {
    type: 'track',
    href: 'HREF',
    external_urls: externalUrls
  };
  await PlayHistory.create({
    track: track._id,
    played_at: Date.now(),
    context
  });
  res.status(200).json({
    status: 'success'
  });
});
*/

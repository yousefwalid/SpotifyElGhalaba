const mongoose = require("mongoose");
const contextSchema = require("./contextObject");

const playHistorySchema = new mongoose.Schema(
  {
    track: {
      type: mongoose.Schema.ObjectId,
      ref: "Track",
      required: [true, "A playHistory must have a Track reference."]
    },
    played_at: {
      type: Date,
      required: [true, "A play history must have a played_at timestamp"]
    },
    context: contextSchema
  },

  {
    toJSON: { virtuals: true }, //show virtual properties when providing the data as JSON
    toObject: { virtuals: true } //show virtual properties when providing the data as Objects
  }
);

const PlayHistory = mongoose.model("PlayHistory", playHistorySchema);

module.exports = PlayHistory;

// //e.g: How to embed docs
// const track = await Track.findOne({ name: "track1" });

//   context = {
//     type: "track",
//     href: "localhost:8000/api/v1/tracks/:track_id"
//   };

//   await PlayHistory.create({
//     track,
//     played_at: Date.now(),
//     context
//   });

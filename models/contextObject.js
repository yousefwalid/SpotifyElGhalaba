const mongoose = require("mongoose");
// const ExternalUrlSchema = require("./externalUrlObject");

const contextSchema = new mongoose.Schema(
  {
    type: {
      type: String
    },
    href: {
      type: String
    }
    // external_urls: {
    //   type: [ExternalUrlSchema]
    // }
  },
  {
    id: false,
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = contextSchema;

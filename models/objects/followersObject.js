const mongoose = require('mongoose');

const FollowersObject = new mongoose.Schema(
  {
    href: {
      type: String
    },
    total: {
      type: Number
    }
  },
  {
    _id: false,
    id: false,
    __v: false
  }
);

module.exports = FollowersObject;

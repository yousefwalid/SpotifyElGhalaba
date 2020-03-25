const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');

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
    strict: 'throw'
  }
);

FollowersObject.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});
module.exports = FollowersObject;

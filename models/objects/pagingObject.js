const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');

const PagingObject = new mongoose.Schema(
  {
    href: String,
    items: [Object],
    limit: Number,
    offset: Number,
    total: Number
  },
  {
    id: false,
    _id: false,
    strict: 'throw'
  }
);

PagingObject.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});

module.exports = PagingObject;

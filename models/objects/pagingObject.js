const mongoose = require('mongoose');

const PagingObject = new mongoose.Schema({
  href: String,
  items: [Object],
  limit: Number,
  offset: Number,
  total: Number
});

module.exports = PagingObject;

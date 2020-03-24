const mongoose = require('mongoose');

/**
 * @typedef {Object} PagingObject
 * @property {String} href A link to the Web API endpoint returning the full result of the request
 * @property {Array<Object>} items The requested data
 * @property {Number} limit The maximum number of items in the response (as set in the query or by default)
 * @property {Number} offset The offset of the items returned (as set in the query or by default)
 */

const PagingObject = new mongoose.Schema({
  href: String,
  items: [Object],
  limit: Number,
  offset: Number,
  total: Number
});

module.exports = PagingObject;

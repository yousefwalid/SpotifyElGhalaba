const mongoose = require('mongoose');

const DeviceObject = new mongoose.Schema(
  {
    name: String,
    id: Number
  },
  {
    _id: false,
    id: false,
    __v: false
  }
);

module.exports = DeviceObject;

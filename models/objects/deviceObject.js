const mongoose = require('mongoose');

const DeviceObject = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      defaut: true
    }
  },
  {
    _id: false,
    id: false,
    __v: false
  }
);

module.exports = DeviceObject;

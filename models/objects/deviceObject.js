const mongoose = require('mongoose');
const idValidator = require('mongoose-id-validator');

const DeviceObject = new mongoose.Schema(
  {
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
    id: false,
    strict: 'throw'
  }
);
DeviceObject.plugin(idValidator, {
  message: 'Bad ID value for {PATH}'
});

module.exports = DeviceObject;
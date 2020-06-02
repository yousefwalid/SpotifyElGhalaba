/* istanbul ignore file */
const mongoose = require('mongoose');

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ database disconnected');
  } catch (err) {
    console.log('❌ Fail during disconnecting database');
  }
};

if (process.env.NODE_ENV === 'testing') {
  after(async () => {
    await disconnectDB();
  });
}

module.exports = disconnectDB;

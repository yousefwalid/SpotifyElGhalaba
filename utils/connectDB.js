const mongoose = require('mongoose');
const loadEnv = require('./loadEnv');

// configuring .env

const connectDB = async () => {
  loadEnv();

  const DB = process.env.DATABASE;
  console.log(DB);
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    console.log('✅ database connected');
  } catch (err) {
    console.log(`❌ Error connecting to database     ${err.toString()}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV === 'testing') {
  before(async function() {
    this.timeout(0);
    await connectDB();
  });
}

module.exports = connectDB;

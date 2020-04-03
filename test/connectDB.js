const mongoose = require('mongoose');
const dotenv = require('dotenv');

// configuring .env
dotenv.config({
  path: './.env.test'
});

// connecting to the db
// remote database credentials
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const connectDB = async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log('✅ database connected');
  } catch (err) {
    console.log(`Error Connecting to DB ❌     ${err.toString()}`);
    process.exit(1);
  }
};

module.exports = connectDB;

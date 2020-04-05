const mongoose = require('mongoose');
const dotenv = require('dotenv');

// configuring .env
dotenv.config({
  path: './.test.env'
});

// connecting to the db
// remote database credentials
console.log(process.env.DATABASE_LOCAL);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const localDB = process.env.DATABASE_LOCAL;
const connectDB = async () => {
  try {
    await mongoose.connect(localDB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log('✅ database connected');
  } catch (err) {
    console.log('❌ database not connected');
    process.exit(1);
  }
};

before(async function() {
  this.timeout(0);
  await connectDB();
});

module.exports = connectDB;

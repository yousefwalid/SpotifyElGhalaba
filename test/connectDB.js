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
  await mongoose.connect(localDB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
  console.log('✅ database connected');
};

module.exports = connectDB;

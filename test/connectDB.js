const mongoose = require('mongoose');
const dotenv = require('dotenv');

// configuring .env
dotenv.config({
    path: './.test.env'
});

// connecting to the db
// remote database credentials
const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

const connectDB = async () => {
    await mongoose.connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    });
    console.log("✅ database connected");
};

module.exports = connectDB;
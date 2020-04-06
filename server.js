const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authenticationController = require('./controllers/authenticationController');
const connectDB = require('./utils/connectDB');

dotenv.config({
  path: './config.env'
});

const app = require('./app');

connectDB().then();

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// server.on('upgrade', authenticationController.protectWs);

process.on('unhandledRejection', err => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', err => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('warning', e => console.warn(e.stack));

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

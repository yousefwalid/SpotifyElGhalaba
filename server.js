const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authenticationController = require('./controllers/authenticationController');
const connectDB = require('./utils/connectDB');

dotenv.config({
  path: './config.env'
});

const app = require('./app');

(async () => {
  await connectDB();

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
})();

// const DB = process.env.DATABASE;

// mongoose
//   .connect(DB, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true
//   })
//   .then(() => console.log('DB connection successful! ✅'))
//   .catch(err => {
//     console.log(`Error Connecting to DB ❌     ${err.toString()}`);
//     process.exit(1);
//   });

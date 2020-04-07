const dotenv = require('dotenv');

module.exports = () => {
  if (process.env.NODE_ENV === 'testing') {
    dotenv.config({
      path: './.test.env'
    });
  } else {
    dotenv.config({
      path: './config.env'
    });
  }
};

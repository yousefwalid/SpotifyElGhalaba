const dotenv = require('dotenv');

/* istanbul ignore file */

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

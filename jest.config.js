module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    '!app.js', // No need to cover bootstrap file
    '!server.js' // No need to cover bootstrap file
  ]
};

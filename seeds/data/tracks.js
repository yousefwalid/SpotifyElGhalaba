const faker = require('faker');

const randomizeNumber = require('./../utils/randomizeNumber');

exports.trackObjects = () => {
  const trackObjects = [];

  for (let i = 0; i < 40; i += 1) {
    const name = faker.name.firstName();
    // eslint-disable-next-line camelcase
    const duration_ms = randomizeNumber(2 * 60 * 1000, 5 * 60 * 1000);
    const explicit = randomizeNumber(0, 10) > 8;

    trackObjects.push({
      name,
      duration_ms,
      explicit
    });
  }
  return trackObjects;
};

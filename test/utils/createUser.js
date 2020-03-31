const faker = require('faker');

module.exports = (type = 'user') => {
  const user = {
    name: faker.name.findName(),
    email: faker.internet.email(),
    gender: 'm',
    country: 'EG',
    type: type,
    product: 'free',
    password: '12345678',
    passwordConfirm: '12345678',
    birthdate: new Date('2000-10-10')
  };

  return user;
};

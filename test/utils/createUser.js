const faker = require('faker');

module.exports = () => {
  const user = {
    name: faker.name.findName(),
    email: faker.internet.email(),
    gender: 'm',
    country: 'EG',
    type: 'user',
    product: 'free',
    password: '12345678',
    passwordConfirm: '12345678',
    birthdate: new Date('2000-10-10')
  };

  return user;
};
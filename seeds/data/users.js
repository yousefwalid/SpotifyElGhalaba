const faker = require('faker');

module.exports = () => {
  const userObjects = [];
  const artistInfoObjects = [];
  const adminObjects = [];

  for (let i = 0; i < 10; i += 1) {
    const userObject = {
      name: faker.name.findName(),
      email: `user${i}@email.com`,
      password: 'password',
      passwordConfirm: 'password',
      gender: 'm',
      birthdate: '1998-09-25',
      type: 'user'
    };
    userObjects.push(userObject);
  }

  for (let i = 0; i < 10; i += 1) {
    const artistObject = {
      name: faker.name.findName(),
      email: `artist${i}@email.com`,
      password: 'password',
      passwordConfirm: 'password',
      gender: 'm',
      birthdate: '1998-09-25',
      type: 'artist'
    };
    artistInfoObjects.push(artistObject);
  }

  for (let i = 0; i < 10; i += 1) {
    const adminObject = {
      name: faker.name.findName(),
      email: `admin${i}@email.com`,
      password: 'password',
      passwordConfirm: 'password',
      gender: 'm',
      birthdate: '1998-09-25',
      type: 'admin'
    };
    adminObjects.push(adminObject);
  }

  return { userObjects, artistInfoObjects, adminObjects };
};

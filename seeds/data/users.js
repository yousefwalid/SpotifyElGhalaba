const faker = require('faker');

module.exports = () => {
  const userObjects = [];
  const artistInfoObjects = [];
  const adminObjects = [];

  for (let i = 0; i < 10; i += 1) {
    const userObject = {
      name: faker.name.findName(),
      email: `user${i}@gmail.com`,
      password: 'password',
      passwordConfirm: 'password',
      gender: 'm',
      birthdate: '1998-09-25',
      phoneNumber: '01112233444',
      type: 'user',
      confirmed: true,
      country: 'EG'
    };
    userObjects.push(userObject);
  }

  for (let i = 0; i < 10; i += 1) {
    const userObject = {
      name: faker.name.findName(),
      email: `user${i + 10}@gmail.com`,
      password: 'password',
      passwordConfirm: 'password',
      gender: 'm',
      birthdate: '1998-09-25',
      phoneNumber: '01112233444',
      type: 'user',
      product: 'premium',
      confirmed: true,
      country: 'EG'
    };
    userObjects.push(userObject);
  }

  for (let i = 0; i < 10; i += 1) {
    const artistObject = {
      name: faker.name.findName(),
      email: `artist${i}@gmail.com`,
      password: 'password',
      passwordConfirm: 'password',
      phoneNumber: '01112233444',
      gender: 'm',
      birthdate: '1998-09-25',
      type: 'artist',
      confirmed: true,
      country: 'EG'
    };
    artistInfoObjects.push(artistObject);
  }

  // for (let i = 0; i < 10; i += 1) {
  //   const adminObject = {
  //     name: faker.name.findName(),
  //     email: `admin${i}@email.com`,
  //     password: 'password',
  //     passwordConfirm: 'password',
  //     gender: 'm',
  //     birthdate: '1998-09-25',
  //     type: 'admin',
  //     confirmed: true,
  // country: 'EG'
  //   };
  //   adminObjects.push(adminObject);
  // }

  return { userObjects, artistInfoObjects, adminObjects };
};

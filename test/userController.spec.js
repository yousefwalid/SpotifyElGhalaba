const assert = require('assert');
const { dropDB } = require('./../utils/dropDB');
const createUser = require('./utils/createUser');
const User = require('../models/userModel');
const userController = require('../controllers/userController');

describe('Testing user controller', function() {
  const userToCreate = createUser();
  userToCreate.email = userToCreate.email.toLowerCase();
  let createdUser;
  this.beforeAll('User', async () => {
    await dropDB();
  });

  it('should add new user', async function() {
    const userBody = createUser();
    userBody.email = userBody.email.toLowerCase();
    const user = await User.create(userBody);

    Object.keys(userBody).forEach(key => {
      if (key === 'password' || key === 'passwordConfirm') return;
      assert.deepStrictEqual(userBody[key], user[key]);
    });
  });

  it('should get the user', async function() {
    const userBody = createUser();
    userBody.email = userBody.email.toLowerCase();
    const user = await User.create(userBody);

    const returnedUser = await userController.getUserLogic(user._id);

    Object.keys(userBody).forEach(key => {
      if (key === 'password' || key === 'passwordConfirm') return;
      assert.deepStrictEqual(userBody[key], returnedUser[key]);
    });
  });

  it('should get the user with specific fields only', async function() {
    const userBody = createUser();
    userBody.email = userBody.email.toLowerCase();
    const user = await User.create(userBody);
    // console.log(user);

    const returnedUser = await userController.getUserLogic(user._id, 'name');

    assert.ok(!returnedUser.email);
  });

  it('throw error if user is not found', async function() {
    const userBody = createUser();
    userBody.email = userBody.email.toLowerCase();
    const user = await User.create(userBody);

    const userId = user._id;

    await User.findByIdAndDelete(userId);

    await assert.rejects(async () => {
      await userController.getUserLogic(userId);
    });
  });

  it('should update the user info', async function() {
    const userBody = createUser();
    userBody.email = userBody.email.toLowerCase();
    const user = await User.create(userBody);

    const updatedUser = await userController.updateUserLogic(user._id, {
      name: 'Nasser'
    });

    assert.deepStrictEqual(updatedUser.name, 'Nasser');
  });

  it('throw error if updating user not found', async function() {
    const userBody = createUser();
    userBody.email = userBody.email.toLowerCase();
    const user = await User.create(userBody);

    const userId = user._id;

    await User.findByIdAndDelete(userId);

    await assert.rejects(async () => {
      await userController.updateUserLogic(userId, {
        name: 'Nasser'
      });
    });
  });
});

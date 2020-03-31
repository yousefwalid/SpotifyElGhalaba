const assert = require('assert');

const connectDB = require('./connectDB');
const disconnectDB = require('./disconnectDB');

const dropDB = require('./dropDB');
const createUser = require('./utils/createUser');
const User = require('../models/userModel');
const userController = require('../controllers/userController');


describe('Testing user controller', function () {
    const userToCreate = createUser();
    userToCreate.email = userToCreate.email.toLowerCase();
    let createdUser;
    this.beforeAll(async () => {
        await connectDB();
        await dropDB();
    });

    it('should add new user', async function () {
        createdUser = await User.create(userToCreate);

        Object.keys(userToCreate).forEach(key => {
            if (key === 'password' || key === 'passwordConfirm') return;
            assert.deepStrictEqual(userToCreate[key], createdUser[key]);
        });
    });

    it('should get the user', async function () {
        const user = await userController.getUserLogic(createdUser._id);

        Object.keys(userToCreate).forEach(key => {
            if (key === 'password' || key === 'passwordConfirm') return;
            assert.deepStrictEqual(userToCreate[key], user[key]);
        });
    });


    it('should get the user with specific fields only', async function () {
        const user = await userController.getUserLogic(createdUser._id, "name");

        assert.ok(!Object.keys(user).includes('email'));

    });

    it('throw error if user is not found', async function () {

        await assert.rejects(async () => {
            await userController.getUserLogic('5e8281b93f83d84d5ab32e51');
        });

    });

    it('should update the user info', async function () {
        const user = await userController.updateUserLogic(createdUser._id, {
            name: 'Nasser'
        });

        assert.deepStrictEqual(user.name, 'Nasser');
    });

    it('throw error if updating user not found', async function () {

        await assert.rejects(async () => {
            await userController.updateUserLogic('5e8281b93f83d84d5ab32e51', {
                name: 'Nasser'
            });
        });

    });

    this.afterAll(async () => {
        await disconnectDB();
    })
});
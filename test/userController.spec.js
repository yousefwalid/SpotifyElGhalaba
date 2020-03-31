// const assert = require('assert');

// const connectDB = require('./connectDB');
// const dropDB = require('./dropDB');
// const createUser = require('./utils/createUser');
// const User = require('../models/userModel');
// const userController = require('../controllers/userController');

// describe('Testing user controller', function () {
//     const userToCreate = createUser();
//     userToCreate.email = userToCreate.email.toLowerCase();
//     let createdUser;
//     this.beforeAll(async () => {
//         await connectDB();
//         await dropDB();
//     });

//     it('Should add new user', async function () {
//         createdUser = await User.create(userToCreate);
//     });

//     it('should get the user', async function () {
//         const user = await userController.getUserLogic(createdUser._id);

//         Object.keys(userToCreate).forEach(key => {
//             if (key === 'password' || key === 'passwordConfirm') return;
//             assert.deepStrictEqual(userToCreate[key], user[key]);
//         });
//     });
// });

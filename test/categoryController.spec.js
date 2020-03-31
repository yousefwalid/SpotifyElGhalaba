const assert = require('assert');
const connectDB = require('./connectDB');
const dropDB = require('./dropDB');
const categoryController = require('../controllers/categoryController');

describe('Testing category controller', function () {
    const categoryToCreate = {
        name: 'Party',
        icons: [{
            width: 50,
            height: 50,
            url: '/Party.png'
        }]
    };

    let createdCategory;

    this.beforeAll(async () => {
        await connectDB();
        await dropDB();
    });

    it('should create new category', async function () {

        await assert.doesNotReject(async () => {
            createdCategory = await categoryController.addCategoryLogic(
                categoryToCreate
            );
        });

    });


    // it('get a category with id', async function () {
    //     // await assert.doesNotReject(async () => {
    //     //     await categoryController.getCategoryLogic(createdCategory._id);
    //     // });

    // });
});
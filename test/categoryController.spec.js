const assert = require('assert');
const connectDB = require('./connectDB');
const dropDB = require('./dropDB');
const categoryController = require('../controllers/categoryController');

describe('Testing category controller', function () {
    this.timeout(10000);
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

        // Object.keys(categoryToCreate).forEach(key => {
        //     if (key === 'icons')
        //         assert.deepStrictEqual(
        //             JSON.stringify(categoryToCreate[key]),
        //             JSON.stringify(Array.from(createdCategory[key]))
        //         );
        //     else assert.deepStrictEqual(categoryToCreate[key], createdCategory[key]);
        // });
    });

    it('get a category with id', async function () {
        await assert.doesNotReject(async () => {
            await categoryController.getCategoryLogic(createdCategory._id);
        });
    });
});
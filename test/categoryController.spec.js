const assert = require('assert');
const {
  dropDB
} = require('./dropDB');
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

  this.beforeAll(async () => {

    await dropDB();
  });

  it('should create new category', async function () {
    await assert.doesNotReject(async () => {
      await categoryController.addCategoryLogic(categoryToCreate);
    });
  });

  // it('get a category with id', async function () {
  //     await assert.doesNotReject(async () => {
  //         await categoryController.getCategoryLogic(createdCategory._id);
  //     });
  // });

});
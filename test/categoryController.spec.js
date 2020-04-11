const assert = require('assert');
const {
    dropDB
} = require('../utils/dropDB');
const categoryController = require('../controllers/categoryController');
const generateCategory = require('./utils/generateCategory');


describe('Testing category controller', function () {

    let category1Body;
    let category2Body;
    let category1;
    let category2;

    this.beforeAll(async () => {
        await dropDB();
        category1Body = await generateCategory();
        category2Body = await generateCategory();
    });

    it('should create new categories', async function () {
        await assert.doesNotReject(async () => {
            category1 = await categoryController.addCategoryLogic(category1Body);
            category2 = await categoryController.addCategoryLogic(category2Body);
        });
    });

    it('get a category with id', async function () {
        const category = await categoryController.getCategoryLogic(category1._id);
        assert.ok(category);
        assert.ok(category.name === category1Body.name);
    });

    it('get a category with invalid id returns an error 404', async function () {
        let categoryId = category1.id;
        categoryId = `${(categoryId).substring(0, categoryId.length - 1)}${categoryId[categoryId.length] === 1? '2' : '1'}`;
        try {
            assert.rejects(await categoryController.getCategoryLogic(categoryId));
        } catch (err) {
            assert.ok(err.statusCode === 404);
        }
    });

    it('get all categories', async function () {
        const names = [category1Body.name, category2Body.name];
        const categories = await categoryController.getAllCategoriesLogic({});
        const categoriesNames = categories.map(category => category.name);

        names.forEach(name => {
            assert.ok(categoriesNames.includes(name));
        });
    });

    it('get categories playlists', async function () {
        const categoryPlaylists = await categoryController.getCategoryPlaylistsLogic(category2.id, {});
        categoryPlaylists.forEach(playlist => {
            assert.ok(playlist.type === 'playlist');
        })
    });



});
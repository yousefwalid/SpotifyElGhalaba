const assert = require('assert');
const {
    dropDB
} = require('../utils/dropDB');
const categoryController = require('../controllers/categoryController');
const generateCategory = require('./utils/generateCategory');
const Category = require('../models/categoryModel');


describe('Testing category controller', function () {

    this.beforeAll(async () => {
        await dropDB();

    });

    it('should create new categories', async function () {
        const category1Body = await generateCategory();
        const category2Body = await generateCategory();

        await assert.doesNotReject(async () => {
            await categoryController.addCategoryLogic(category1Body);
            await categoryController.addCategoryLogic(category2Body);
        });
    });

    it('get a category with id', async function () {

        const categoryBody = await generateCategory();
        const category = await Category.create(categoryBody);

        const returnedCategory = await categoryController.getCategoryLogic(category._id);

        assert.ok(returnedCategory);
        assert.ok(returnedCategory.name === category.name);
    });

    it('get a category with invalid id returns an error 404', async function () {
        const categoryBody = await generateCategory();
        const category = await Category.create(categoryBody);

        let categoryId = category.id;
        categoryId = `${(categoryId).substring(0, categoryId.length - 1)}${categoryId[categoryId.length] === 1? '2' : '1'}`;

        try {
            assert.rejects(await categoryController.getCategoryLogic(categoryId));
        } catch (err) {
            assert.ok(err.statusCode === 404);
        }
    });

    it('get all categories', async function () {
        const category1Body = await generateCategory();
        const category2Body = await generateCategory();
        const category1 = await Category.create(category1Body);
        const category2 = await Category.create(category2Body);

        const categories = await categoryController.getAllCategoriesLogic({});
        const categoriesNames = categories.map(category => category.name);

        assert.ok(categoriesNames.includes(category1.name));
        assert.ok(categoriesNames.includes(category2.name));

    });

    it('get categories playlists', async function () {
        const categoryBody = await generateCategory();
        const category = await Category.create(categoryBody);

        const categoryPlaylists = await categoryController.getCategoryPlaylistsLogic(category.id, {});
        categoryPlaylists.forEach(playlist => {
            assert.ok(playlist.type === 'playlist');
        });
    });
});
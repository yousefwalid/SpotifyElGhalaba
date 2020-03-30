const assert = require('assert');
const connectDB = require('./connectDB');

describe('Testing add function', function () {
    this.beforeAll(async () => {
        await connectDB();
    });

    it('should return 5', function () {
        assert.strictEqual(3 + 2, 5);
    });
});
const assert = require('assert');
const excludePopulationFields = require('./../utils/excludePopulationFields');
const validateLimitOffset = require('./../utils/validateLimitOffset');

describe('Testing Utility Module', function() {
  it('Testing excludePopulationFields', () => {
    const fieldsString = 'x.a.b.c, x.c, x.d.e, z.a, y.b.c';
    const remainedStr = 'z.a,,y.b.c,x';

    const excludedStr = 'a.b.c, c, d.e,';

    const returnObj = excludePopulationFields(fieldsString, 'x');
    assert.deepStrictEqual(returnObj.fieldsString, remainedStr);
    assert.deepStrictEqual(returnObj.trimmedString, excludedStr);
  });
  it('Testing validating limit and offset', function() {
    let { limit, offset } = validateLimitOffset();
    assert.strictEqual(limit, 20);
    assert.strictEqual(offset, 0);
    try {
      limit = validateLimitOffset(50, 0);
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
    try {
      limit = validateLimitOffset(-1, 0);
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
    try {
      limit = validateLimitOffset(60, 0);
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
    }
  });
});

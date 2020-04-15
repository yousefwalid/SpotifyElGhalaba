const assert = require('assert');
const excludePopulationFields = require('./../utils/excludePopulationFields');

describe('Testing Utility Module', function() {
  it('Testing excludePopulationFields', () => {
    const fieldsString = 'x.a.b.c, x.c, x.d.e, z.a, y.b.c';
    const remainedStr = 'z.a,,y.b.c,x';

    const excludedStr = 'a.b.c, c, d.e,';

    const returnObj = excludePopulationFields(fieldsString, 'x');
    assert.deepStrictEqual(returnObj.fieldsString, remainedStr);
    assert.deepStrictEqual(returnObj.trimmedString, excludedStr);
  });
});

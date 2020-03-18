module.exports = function(fieldString) {
  fieldString = fieldString.split(' ').join('');
  fieldString = fieldString.replace(/\)/g, ',)');
  fieldString = fieldString.replace(/\(/g, '(,');
  let parsedArray = fieldString.split(/[,]+/);
  let parent = [];
  let object = {};

  parsedArray.forEach(el => {
    if (el.endsWith('(')) {
      parent.push(el.replace('(', ''));
    } else if (el == ')') {
      parent.pop();
    } else {
      if (parent.length == 0) object[el] = 1;
      else object[parent.join('.') + '.' + el] = 1;
    }
  });

  return object;
};

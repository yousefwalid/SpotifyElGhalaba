module.exports = function(fieldString) {
  fieldString = fieldString.split(' ').join('');
  fieldString = fieldString.replace(/\)/g, ',)');
  fieldString = fieldString.replace(/\(/g, '(,');
  let parsedArray = fieldString.split(/[,]+/);
  let parent = [];
  let paramsArray = [];

  parsedArray.forEach(el => {
    if (el.endsWith('(')) {
      parent.push(el.replace('(', ''));
    } else if (el == ')') {
      parent.pop();
    } else {
      if (parent.length == 0) paramsArray.push(el);
      else paramsArray.push(parent.join('.') + '.' + el);
    }
  });

  return paramsArray.join(' ');
};

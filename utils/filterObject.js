module.exports = function(obj, allowedFields) {
  Object.keys(obj).forEach(el => {
    if (!allowedFields.includes(el)) obj[el] = undefined;
  });

  return obj;
};

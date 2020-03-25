module.exports = function(obj, allowedFields) {
  Object.keys(obj).forEach(el => {
    if (!allowedFields.includes(el)) delete obj[el];
  });

  return obj;
};

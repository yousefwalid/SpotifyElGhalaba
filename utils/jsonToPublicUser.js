const filterObject = require('./filterObject');

module.exports = function(userObject) {
  if (!userObject) userObject = {};

  const publicUserFields = [
    'name',
    'external_urls',
    'followers',
    'href',
    'id',
    'images',
    'image',
    'type',
    'uri'
  ];

  const publicUserObject = filterObject(userObject, publicUserFields);
  return publicUserObject;
};

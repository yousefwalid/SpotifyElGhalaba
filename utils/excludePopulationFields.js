/**
 * @module Utility Module
 * This function takes a fields string and removes all strings with fieldName prefix
 * If the fieldName isn't in the query string, the function adds it
 * @param {String} fieldsString The string to be parsed
 * @param {String} fieldName The prefix that must be removed by the function
 * @return {Object} An object containing the modified fieldsString and the trimmedString containing the filter Object
 */
module.exports = function(fieldsString, fieldName) {
  trimmedStringArray = [];
  fieldsStringArray = fieldsString.split(' ');

  for (let i = 0; i < fieldsStringArray.length; i++) {
    let el = fieldsStringArray[i];
    if (el.startsWith(fieldName + '.')) {
      trimmedStringArray.push(el.slice(fieldName.length + 1));
      fieldsStringArray.splice(i, 1);
      if (!fieldsStringArray.includes(fieldName))
        fieldsStringArray.push(fieldName);
      i--;
    }
  }

  fieldsString = fieldsStringArray.join(',');
  trimmedString = trimmedStringArray.join(' ');

  return { fieldsString, trimmedString };
};

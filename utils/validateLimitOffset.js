const AppError = require('./appError');
/**
 * Validates the ranges of limit and offset
 * @param {Number} limit The limit parameter, defaults to 20 if not passed
 * @param {Number} offset The offset parameter, defaults to 0 if not passed
 * @returns limit,offset
 */
module.exports = (limit, offset) => {
  limit = limit * 1 || 20;
  offset = offset * 1 || 0;

  if (limit <= 0)
    throw new AppError(
      'Limit query parameter can not be less than or equal to 0',
      400
    );

  if (limit > 50)
    throw new AppError('Limit query parameter can not be greater than 50', 400);

  return {
    limit,
    offset
  };
};

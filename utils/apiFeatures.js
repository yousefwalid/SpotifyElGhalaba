const parseFields = require('./parseFields');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = {
      ...this.queryString
    };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'offset'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    if (this.query) this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  filterOne() {
    const queryObj = {
      ...this.queryString
    };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'offset'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    if (this.query) this.query = this.query.findOne(JSON.parse(queryStr));

    return this;
  }

  // sort() {
  //   if (this.queryString.sort) {
  //     const sortBy = this.queryString.sort.split(',').join(' ');
  //     if (this.query) this.query = this.query.sort(sortBy);
  //   } else if (this.query) {
  //     this.query = this.query.sort('-createdAt');
  //   }

  //   return this;
  // }

  // fields() {
  //   if (this.queryString.fields) {
  //     const fields = this.queryString.fields.split(',').join(' ');
  //     if (this.query) this.query = this.query.select(fields);
  //   } else if (this.query) {
  //     //this.query = this.query.select('-__v');
  //   }

  //   return this;
  // }

  /**
   * Parses the request fields parameter in Spotify's parenthesis format, and then apply query select on those fields
   */
  limitFieldsParenthesis() {
    if (this.queryString && this.queryString.fields) {
      const fields = parseFields(this.queryString.fields);

      if (this.query) this.query = this.query.select(fields);
    }

    return this;
  }

  // paginate() {
  //   const page = this.queryString.page * 1 || 1;
  //   const limit = this.queryString.limit * 1 || 100;
  //   const skip = (page - 1) * limit;

  //   if (this.query) this.query = this.query.skip(skip).limit(limit);

  //   return this;
  // }

  skip() {
    this.queryString.limit = this.queryString.limit * 1 || 100;
    this.queryString.offset = this.queryString.offset * 1 || 0;

    if (this.query)
      this.query = this.query
        .skip(this.queryString.offset)
        .limit(this.queryString.limit);

    return this;
  }
}
module.exports = APIFeatures;

const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
//This File Is An Interface For AWS-SDK module - No Need For Testing
/* istanbul ignore file */
class Aws {
  constructor(s3) {
    if (s3) this.s3 = s3;
    else
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        httpOptions: {
          timeout: 900000 // 15 minutes
        }
      });
  }

  /**
   *
   * Sets the multerStorage Configurations.
   * @param {Object} s3   The aws.s3 object. [Default is a new aws s3 object with the global key and id in process.env]
   * @param {String} bucket   The name of the bucket in S3. [Default to the global bucket name in process.env]
   * @param {Function} metadata The metadata option is a callback that accepts the request and file, and returns a metadata object to be saved to S3.[default is an object with one property: fieldname]
   * @param {Function} key The metadata option is a callback that accepts the request and file, and returns the file name/Path to be saved to S3.[default is the current datetime]
   */
  setMulterStorage(s3, bucket, metadata, key) {
    const storage = {};
    if (s3) storage.s3 = s3;
    else storage.s3 = this.s3;
    if (bucket) storage.bucket = bucket;
    else storage.bucket = process.env.AWS_BUCKET_NAME;
    if (metadata) storage.metadata = metadata;
    else {
      storage.metadata = function(req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      };
    }
    if (key) storage.key = key;
    else {
      storage.key = function(req, file, cb) {
        cb(null, Date.now().toString());
      };
    }

    this.multerStorage = multerS3(storage);
  }

  /**
   *
   * @param {Object} options Contains multer objects like {limits, fileFilter, preservePath}. NOTE: The storage option is set by the function setMulterStorage
   */
  setMulterUploadOptions(options) {
    const multerOptions = { storage: this.multerStorage };
    if (options) Object.assign(multerOptions, options);
    else {
      multerOptions.limits = { fields: 1, fileSize: 10e9, files: 1, parts: 2 };
    }
    this.upload = multer(multerOptions);
  }

  /**
   *
   * @param {String} key File name/path.
   * @returns {Object} Object contains the headers of the download request.[Content-Type, Content-Length,...]
   */
  async getHeadObject(Key) {
    return await this.s3
      .headObject({
        Key,
        Bucket: process.env.AWS_BUCKET_NAME
      })
      .promise();
  }

  /**
   *
   * @returns multer upload object.
   */
  getMulterUpload() {
    return this.upload;
  }

  /**
   *
   * @param {String} Key File name/path
   * @param {String} Range Range of bytes to be read. Written in the following format: byte=[start]-[end] such that start/end are two integer numbers.
   */
  s3createReadStream(Key, Range) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key
    };
    if (Range) params.Range = Range;
    this.s3Obj = this.s3.getObject(params);
    return this.s3Obj.createReadStream();
  }

  /**
   * @returns {Object} returns s3.getObject()
   */
  getS3Obj() {
    return this.s3;
  }

  /**
   *
   * @param {String} Key File name/path.
   * @returns {Object} downloaded data buffer.
   */
  s3Download(Key) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key
    };
    this.s3.getObject(params, function(err, data) {
      if (err) return err;
      return data;
    });
  }
}

module.exports = Aws;

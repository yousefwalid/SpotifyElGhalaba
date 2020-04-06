const sharp = require('sharp');
const AwsS3Api = require('./awsS3Api');
const AppError = require('./appError');
/**
 *  Responsible for uploading images to AWS Bucket, please take care that each dimension has its corresponding qualityNames
 *  @param {Buffer} imageData The image data sent in the request,
 *  @param {String} modelName The string of the model this image is for, eg: album, artist
 *  @param {String} modelId The id of this instance of the model
 *  @param {Array<Array<Number>>} dimensions A 2D array containing the dimensions of the images, eg: [[50,50], [20,20]]
 *  @param {Array<String>} qualityNames An array containing the names of the qualities of each dimensions of photos, etc. High, Medium, Low.
 *  @returns {Array<imageObject>} An array containing the imageObjects of the images stored in AWS
 */
module.exports = async (
  imageData,
  modelName,
  modelId,
  dimensions,
  qualityNames
) => {
  if (!imageData || !modelName || !modelId || !dimensions || !qualityNames)
    throw new AppError('Missing parameters in function', 500);
  const buf = Buffer.from(imageData, 'base64');

  const awsObj = new AwsS3Api();

  const imgObjects = [];

  dimensions.forEach(async (dimension, i) => {
    const name = qualityNames[i];
    const img = await sharp(buf)
      .resize(dimension[0], dimension[1])
      .toBuffer();

    const key = `photos/${modelName}-${modelId}-${name}.jpeg`;
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/`;

    await awsObj.s3.putObject({
      Body: img,
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });

    imgObjects.push({
      width: dimension[0],
      height: dimension[1],
      url: `${url}${key}`
    });
  });

  return imgObjects;
};

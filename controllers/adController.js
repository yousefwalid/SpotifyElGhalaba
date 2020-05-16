const uploadAWSImage = require('../utils/uploadAWSImage');
const catchAsync = require('../utils/catchAsync');
const Ad = require('./../models/AdModel');
const AppError = require('./../utils/appError');

/*istanbul ignore next*/
//Uses AWS API
const uploadImage = async (fileData, ad) => {
  const dimensions = [
    [640, 640],
    [300, 300],
    [60, 60]
  ];
  const qualityNames = ['High', 'Medium', 'Low'];
  const imgObjects = await uploadAWSImage(
    fileData,
    'ad',
    ad._id,
    dimensions,
    qualityNames
  );
  if (!imgObjects)
    throw new AppError(
      'There was a problem uploading the images to the server',
      500
    );
  ad.images = imgObjects;
  await ad.save();
};

exports.insertAd = catchAsync(async (req, res, next) => {
  if (!req.files.image.data) throw new AppError('Invalid file uploaded', 400);
  const ad = await Ad.create({ adText: req.body.text });
  if (!ad) {
    throw new AppError('Could not create a new Ad', 500);
  }
  await uploadImage(req.files.image.data, ad);
  res.status(202).json({
    status: 'success',
    message: 'Image Uploaded successfully'
  });
});

exports.getAd = catchAsync(async (req, res, next) => {
  if (req.user.product === 'premium')
    res.status(400).json({
      status: 'fail',
      message: 'premium users cannot have ads'
    });
  else {
    const ads = await Ad.find({});
    const size = ads.length;
    const randomIndex = Math.floor(Math.random(size));
    let selectedAd;
    if (size === 0) selectedAd = null;
    else selectedAd = ads[randomIndex];

    res.status(200).json({
      ad: selectedAd
    });
  }
});

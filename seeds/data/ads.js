const faker = require('faker');
const fs = require(`fs`);
const path = require(`path`);
const uploadAWSImage = require('../../utils/uploadAWSImage');
const Ad = require('../../models/AdModel');
const util = require('util');
const readFile = util.promisify(fs.readFile);

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
    throw Error('There was a problem uploading the images to the server');
  ad.images = imgObjects;
  await ad.save();
};

exports.createAds = async () => {
  const imagesDir = path.join(__dirname, '/../ads');
  const fileNames = fs.readdirSync(imagesDir);
  const numberOfFilesToUpload = fileNames.length; //fileNames.length
  const imageFileNames = fileNames.slice(0, numberOfFilesToUpload);

  for (let i = 0; i < imageFileNames.length; i += 1) {
    const imageName = imageFileNames[i];
    const data = await readFile(path.join(imagesDir, imageName));
    const ad = await Ad.create({ adText: faker.lorem.sentence() });
    await uploadImage(data, ad);
  }
};

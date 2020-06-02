const fs = require(`fs`);
const path = require(`path`);
const mm = require(`music-metadata`);
const util = require('util');
const faker = require('faker');
const { ObjectId } = require('mongoose').Types;

const readFile = util.promisify(fs.readFile);
const Track = require('./../../models/trackModel');
const AwsS3Api = require('./../../utils/awsS3Api');

const randomizeNumber = require('./../utils/randomizeNumber');

exports.trackObjects = () => {
  const trackObjects = [];

  for (let i = 0; i < 10; i += 1) {
    const name = faker.name.firstName();
    // eslint-disable-next-line camelcase
    const duration_ms = randomizeNumber(2 * 60 * 1000, 5 * 60 * 1000);
    const explicit = randomizeNumber(0, 10) > 8;

    trackObjects.push({
      name,
      duration_ms,
      explicit
    });
  }
  return trackObjects;
};

exports.createTracks = async albums => {
  // const trackObjects = trackSeed.trackObjects();
  const awsObj = new AwsS3Api();
  const s3 = awsObj.getS3Obj();
  const tracksDir = path.join(__dirname, '/../tracks');
  const fileNames = fs.readdirSync(tracksDir);
  const numberOfFilesToUpload = fileNames.length; //fileNames.length
  const trackFileNames = fileNames.slice(0, numberOfFilesToUpload);

  const tracks = [];
  let trackIndex = 0;
  for (let j = 0; j < albums.length; j += 1) {
    if (trackIndex >= trackFileNames.length) break;
    const album = albums[j];
    const trackCount =
      trackIndex === trackFileNames.length - 1 ? 1 : randomizeNumber(1, 2);

    for (let i = 0; i < trackCount; i += 1) {
      const trackName = trackFileNames[trackIndex];
      const newTrack = {
        // ...trackObjects[trackIndex],
        explicit: randomizeNumber(0, 10) > 8,
        name: trackName.replace('mp3', ''),
        duration_ms:
          (await mm.parseFile(path.join(tracksDir, trackName))).format
            .duration * 1000,
        disc_number: 1,
        album: new ObjectId(album._id),
        artists: album.artists.map(el => new ObjectId(el))
      };

      // eslint-disable-next-line no-await-in-loop
      const track = await Track.create(newTrack);
      tracks.push(track);
      try {
        const data = await readFile(path.join(tracksDir, trackName));
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `track-${track._id}`,
          Body: data
        };
        // eslint-disable-next-line no-shadow
        await s3.putObject(params).promise();
        // console.log(data);
        console.log(`Track File #${trackIndex + 1} uploaded successfully`);
        // console.log(uploadData);
      } catch (err) {
        console.log(err);
      }

      trackIndex += 1;
    }
  }
  // await s3.listObjects(
  //   {
  //     Bucket: process.env.AWS_BUCKET_NAME // pass your bucket name
  //   },
  //   function(err, data) {
  //     if (err) throw err;
  //     console.log(data.Contents.slice(-100, -1));
  //   }
  // );
  console.log('Finished Uploading Tracks');

  return tracks;
};

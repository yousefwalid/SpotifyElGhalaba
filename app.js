// Fundamental libs
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const geoip = require('geoip-lite');
const device = require('express-device');
const DeviceDetector = require('node-device-detector');
const expressWs = require('express-ws');

const errorController = require('./controllers/errorController');

const app = express();
const appws = expressWs(app);
const cors = require('cors');

// Routers
const authenticationRouter = require('./routes/authenticationRoutes');
const streamingRouter = require('./routes/streamingRoutes');
const userRouter = require('./routes/userRoutes');
const albumRouter = require('./routes/albumRoutes');
const trackRouter = require('./routes/trackRoutes');
const browseRouter = require('./routes/browseRoutes');
const playlistRouter = require('./routes/playlistRoutes');
const meRouter = require('./routes/meRoutes');
const audioFeaturesRouter = require('./routes/audioFeaturesRoutes');
const artistRouter = require('./routes/artistRoutes');
const playerRouter = require('./routes/playerRoutes');

// Utils
const AppError = require('./utils/appError');

// 1) MIDDLEWARES

// 1) set security http headers
//Should be put at the top of the middleware stack
//Adds security headers
app.use(helmet());
app.use(cors());
//2) Limit requests
const limiter = rateLimit({
  //limits 100 requests for each IP in one hour.
  //If the IP exceeds this limit then it would have to wait for an hour to pass from the first request.
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: {
    status: 'fail',
    message: 'Two many requests from this IP. please try again in an hour.'
  }
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (process.env.NODE_ENV === 'development') {
  app.enable('trust proxy');
}

//4)Body parser and data sanitization
//First: Reading data from the body of the request as json and converting it to javascript object into req.body
app.use(
  express.json({
    // This option limits the body data of the request to 10KB
    limit: '10kb'
  })
);

//Second: Data sanitization against NoSQL injection attacks.
app.use(mongoSanitize());

//Third: Data sanitization against XSS(cross-site scripting) attacks.
app.use(xss());

//Fourth: Prevent parameter pollution (prevents duplicate query string parameters)
// app.use(
//   hpp({
//     whitelist: []
//   })
// );

//Parse cookies.
app.use(cookieParser());

//Get the time at which the request is sent.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Get the country of the public ip address that sends the request
app.use((req, res, next) => {
  req.geoip = geoip.lookup(req.ip);
  next();
});

//Get info of the device that sends the request
app.use(device.capture());
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'];
  const detector = new DeviceDetector();
  const result = detector.detect(userAgent);
  req.thisDevice = result;
  next();
});

//Serve Static files
app.use(express.static(`${__dirname}/public`));

// 2) ROUTES
const apiVersion = 1;
const baseApiUrl = `/api/v${apiVersion}`;

app.use(`${baseApiUrl}/streaming`, streamingRouter);

app.use('/api', limiter); //Use rate limiter for all routes except streaming routes

app.use(`${baseApiUrl}/authentication`, authenticationRouter);
app.use(`${baseApiUrl}/users`, userRouter);
app.use(`${baseApiUrl}/albums`, albumRouter);
app.use(`${baseApiUrl}/tracks`, trackRouter);
app.use(`${baseApiUrl}/playlists`, playlistRouter);
app.use(`${baseApiUrl}/browse`, browseRouter);
app.use(`${baseApiUrl}/me/player`, playerRouter);
app.use(`${baseApiUrl}/me`, meRouter);
app.use(`${baseApiUrl}/audio-features`, audioFeaturesRouter);
app.use(`${baseApiUrl}/artists`, artistRouter);

// 404, route not found
app.use('*', (req, res, next) => {
  const error = new AppError("This route can't be found", 404);
  next(error);
});

app.use(errorController);

module.exports = app;

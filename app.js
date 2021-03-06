// Fundamental libs
const express = require('express');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const device = require('express-device');
const DeviceDetector = require('node-device-detector');
const expressWs = require('express-ws');
const cors = require('cors');
const passport = require('passport');
const errorController = require('./controllers/errorController');

const app = express();
const appws = expressWs(app);

// Routers
const authenticationRouter = require('./routes/authenticationRoutes');
const streamingRouter = require('./routes/streamingRoutes');
const userRouter = require('./routes/userRoutes');
const adRouter = require('./routes/adRoutes');
const albumRouter = require('./routes/albumRoutes');
const trackRouter = require('./routes/trackRoutes');
const browseRouter = require('./routes/browseRoutes');
const playlistRouter = require('./routes/playlistRoutes');
const meRouter = require('./routes/meRoutes');
const audioFeaturesRouter = require('./routes/audioFeaturesRoutes');
const artistRouter = require('./routes/artistRoutes');
const playerRouter = require('./routes/playerRoutes');
const searchRouter = require('./routes/searchRoutes');

const apiVersion = process.env.API_VERSION;
const baseApiUrl = `${process.env.API_BASE_URL}/v${apiVersion}`;
// let apiDomain;
// if (process.env.NODE_ENV === 'development')
//   apiDomain = `${process.env.DOMAIN_DEVELOPMENT}:${process.env.PORT}`;
// else if (process.env.NODE_ENV === 'production')
//   apiDomain = `${process.env.DOMAIN_PRODUCTION}:${process.env.PORT}`;

// Utils
const AppError = require('./utils/appError');

// 1) MIDDLEWARES

// 1) set security http headers
//Should be put at the top of the middleware stack
//Adds security headers
app.use(helmet());

//2) Limit requests
// const limiter = rateLimit({
//   //limits 1000 requests for each IP in one hour.
//   //If the IP exceeds this limit then it would have to wait for an hour to pass from the first request.
//   max: 1000,
//   windowMs: 60 * 60 * 1000,
//   message: {
//     status: 'fail',
//     message: 'Too many requests from this IP. please try again in an hour.'
//   }
// });

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.enable('trust proxy');

//CORS headers

const corsOptions = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization,X-Forwarded-For',
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};
// const corsOptionsDelegate = function (req, callback) {
//   if (req.url === `${baseApiUrl}/authentication/login`) {
//     corsOptions.origin = true;
//   } else {
//     corsOptions.origin = '*';
//   }
//   callback(null, corsOptions); // callback expects two parameters: error and options
// };
app.use(cors(corsOptions));

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

app.use((req, res, next) => {
  req.baseApiUrl = baseApiUrl;
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use(`${baseApiUrl}/streaming`, streamingRouter);

// app.use('/api', limiter); //Use rate limiter for all routes except streaming routes

app.use(`${baseApiUrl}/authentication`, authenticationRouter);
app.use(`${baseApiUrl}/users`, userRouter);
app.use(`${baseApiUrl}/ads`, adRouter);
app.use(`${baseApiUrl}/albums`, albumRouter);
app.use(`${baseApiUrl}/tracks`, trackRouter);
app.use(`${baseApiUrl}/playlists`, playlistRouter);
app.use(`${baseApiUrl}/browse`, browseRouter);
app.use(`${baseApiUrl}/me/player`, playerRouter);
app.use(`${baseApiUrl}/me`, meRouter);
app.use(`${baseApiUrl}/audio-features`, audioFeaturesRouter);
app.use(`${baseApiUrl}/artists`, artistRouter);
app.use(`${baseApiUrl}/search`, searchRouter);

// 404, route not found
app.use('*', (req, res, next) => {
  const error = new AppError("This route can't be found", 404);
  next(error);
});

app.use(errorController);

module.exports = app;

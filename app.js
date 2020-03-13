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
const errorController = require('./controllers/errorController');

const app = express();

// Routers
const authenticationRouter = require('./routes/authenticationRoutes');
const userRouter = require('./routes/userRoutes');
const albumRouter = require('./routes/albumRoutes');
const trackRouter = require('./routes/trackRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const browseRouter = require('./routes/browseRoutes');
const playlistRouter = require('./routes/playlistRoutes');
const meRouter = require('./routes/meRoutes');

// Utils
const AppError = require('./utils/appError');

// 1) MIDDLEWARES

// 1) set security http headers
//Should be put at the top of the middleware stack
//Adds security headers
app.use(helmet());

//2) Limit requests
const limiter = rateLimit({
  //limits 100 requests for each IP in one hour. If the IP exceeds this limit then it would have to wait for an hour to pass from the first request
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: {
    status: 'fail',
    message: 'Two many requests from this IP. please try again in an hour.'
  }
});
app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (process.env.NODE_ENV === 'development') {
  app.enable('trust proxy');
}
//4)Body parser and data sanitization
//First: Reading data from the body of the request as json and converting it to javascript object into req.body
app.use(express.json({
  limit: '10kb'
})); // The option limits the body data of the request to 10KB
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
app.use(cookieParser());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.geoip = geoip.lookup(req.ip);
  next();
});

// 2) ROUTES
const apiVersion = 1;
const baseApiUrl = `/api/v${apiVersion}`;

app.use(`${baseApiUrl}/authentication`, authenticationRouter);
app.use(`${baseApiUrl}/users`, userRouter);
app.use(`${baseApiUrl}/albums`, albumRouter);
app.use(`${baseApiUrl}/tracks`, trackRouter);
app.use(`${baseApiUrl}/playlists`, playlistRouter);
app.use(`${baseApiUrl}/browse`, browseRouter);
app.use(`${baseApiUrl}/me`, meRouter);

// 404, route not found
app.use('*', (req, res, next) => {
  const error = new AppError("This route can't be found", 404);
  next(error);
});

app.use(errorController);

module.exports = app;
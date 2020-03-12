// Fundamental libs
const express = require('express');
const morgan = require('morgan');
const geoip = require('geoip-lite');
const errorController = require('./controllers/errorController');

const app = express();

// Routers
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
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (process.env.NODE_ENV === 'development') {
  app.enable('trust proxy');
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use((req, res, next) => {
  req.geoip = geoip.lookup(req.ip);
  next();
});

// 2) ROUTES
const apiVersion = 1;
const baseApiUrl = `/api/v${apiVersion}`;

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

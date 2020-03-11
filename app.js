//fundamental libs
const express = require('express');
const morgan = require('morgan');
const geoip = require('geoip-lite');
const errorController = require('./controllers/errorController');

const app = express();

//routers
const userRouter = require('./routes/userRoutes');

//utils
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

app.use('/api/v1/users', userRouter);

// 404, route not found
app.use('*', (req, res, next) => {
  const error = new AppError("This route can't be found", 404);
  next(error);
});

app.use(errorController);

module.exports = app;

//fundamental libs
const express = require('express');
const morgan = require('morgan');

const app = express();

//routers
const userRouter = require('./routes/userRoutes');
const albumRouter = require('./routes/albumRoutes');
const trackRouter = require('./routes/trackRoutes');
//utils
const AppError = require('./utils/appError');

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/albums', albumRouter);
app.use('/api/v1/tracks', trackRouter);
// 404, route not found
app.use('*', (req, res, next) => {
  const error = new AppError("This route can't be found", 404);
  next(error);
});

// app.use(errorHandler);

module.exports = app;

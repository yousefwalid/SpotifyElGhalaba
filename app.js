//fundamental libs
const express = require("express");
const morgan = require("morgan");

const app = express();

//utils
const appError = require("./utils/appError");
const errorHandler = require("./controllers/errorController");

// 1) MIDDLEWARES
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 404, route not found
app.use("*", (req, res, next) => {
  const error = new appError("This route can't be found", 404);
  next(error);
});

app.use(errorHandler);

module.exports = app;

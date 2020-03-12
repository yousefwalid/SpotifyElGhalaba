const express = require('express');
const categoryRouter = require('./categoryRoutes');
const albumController = require('./../controllers/albumController');

const router = express.Router();

router.use("/categories", categoryRouter);

// router.route("/new-releases").get(albumController);

module.exports = router;
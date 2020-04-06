const express = require('express');
const searchController = require('./../controllers/searchController');

const router = express.Router();

router.use("/", searchController.search);

module.exports = router;
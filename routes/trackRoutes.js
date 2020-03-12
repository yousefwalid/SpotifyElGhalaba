const express = require('express');
const trackController = require('./../controllers/trackController');

const router = express.Router();

router.route('/:id').get(trackController.getTrack);
module.exports = router;

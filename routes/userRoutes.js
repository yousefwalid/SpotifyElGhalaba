const express = require('express');
const User = require("./../models/userModel");

const router = express.Router();


router
    .route('/')
    .post(async (req, res, next) => {
        const user = req.body;

        const newUser = await User.create(user);

        res.status(200).json({
            state: "success",
            data: {
                newUser
            }
        });
    });


module.exports = router;
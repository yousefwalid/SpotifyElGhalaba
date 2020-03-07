const express = require('express');
const User = require("./../models/userModel");

const router = express.Router();


router
    .route('/')
    .post(async (req, res, next) => {
        try {
            const user = req.body;

            const newUser = await User.create(user);

            res.status(200).json({
                state: "success",
                data: {
                    newUser
                }
            });

        } catch (err) {
            res.status(400).json({
                state: "fail",
                data: {
                    err
                }
            });

        }

    });


module.exports = router;
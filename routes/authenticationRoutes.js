const express = require('express');

const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

/*
    ###    ##     ## ######## ##     ## ######## ##    ## ######## ####  ######     ###    ######## ####  #######  ##    ##    ########   #######  ##     ## ######## ########  ######  
   ## ##   ##     ##    ##    ##     ## ##       ###   ##    ##     ##  ##    ##   ## ##      ##     ##  ##     ## ###   ##    ##     ## ##     ## ##     ##    ##    ##       ##    ## 
  ##   ##  ##     ##    ##    ##     ## ##       ####  ##    ##     ##  ##        ##   ##     ##     ##  ##     ## ####  ##    ##     ## ##     ## ##     ##    ##    ##       ##       
 ##     ## ##     ##    ##    ######### ######   ## ## ##    ##     ##  ##       ##     ##    ##     ##  ##     ## ## ## ##    ########  ##     ## ##     ##    ##    ######    ######  
 ######### ##     ##    ##    ##     ## ##       ##  ####    ##     ##  ##       #########    ##     ##  ##     ## ##  ####    ##   ##   ##     ## ##     ##    ##    ##             ## 
 ##     ## ##     ##    ##    ##     ## ##       ##   ###    ##     ##  ##    ## ##     ##    ##     ##  ##     ## ##   ###    ##    ##  ##     ## ##     ##    ##    ##       ##    ## 
 ##     ##  #######     ##    ##     ## ######## ##    ##    ##    ####  ######  ##     ##    ##    ####  #######  ##    ##    ##     ##  #######   #######     ##    ########  ######  
*/
router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.patch('/resetPassword/:token', authenticationController.resetPassword);
router.patch(
  '/updatePassword',
  authenticationController.protect,
  authenticationController.updatePassword
);

/*
 
 ########  #######  ########     ######## ########  ######  ######## #### ##    ##  ######   
 ##       ##     ## ##     ##       ##    ##       ##    ##    ##     ##  ###   ## ##    ##  
 ##       ##     ## ##     ##       ##    ##       ##          ##     ##  ####  ## ##        
 ######   ##     ## ########        ##    ######    ######     ##     ##  ## ## ## ##   #### 
 ##       ##     ## ##   ##         ##    ##             ##    ##     ##  ##  #### ##    ##  
 ##       ##     ## ##    ##        ##    ##       ##    ##    ##     ##  ##   ### ##    ##  
 ##        #######  ##     ##       ##    ########  ######     ##    #### ##    ##  ######   
 
*/

// const mongoose = require('mongoose');
// const User = require('./../models/userModel');
// const Artist = require('./../models/artistModel');
// const catchAsync = require('./../utils/catchAsync');
// router.post(
//   '/test',
//   catchAsync(async (req, res, next) => {
//     const user = await User.findOne({ email: 'artist@spotify.com' });

//     let artist = await Artist.findOne({
//       userInfo: new mongoose.Types.ObjectId(user._id)
//     });
//     artist = await Artist.findByIdAndUpdate(
//       artist,
//       { $push: { genres: req.body.genres } },
//       {
//         new: true,
//         runValidators: true
//       }
//     );

//     // console.log(req.body.image);
//     // const user = await User.findByIdAndUpdate(
//     //   await User.find({ email: 'mohamed.adel_5@yahoo.com' }),
//     //   { image: req.body.image },
//     //   {
//     //     new: true,
//     //     runValidators: true
//     //   }
//     // );
//     // const newUser = await User.create({
//     //   name: req.body.name,
//     //   email: req.body.email,
//     //   password: req.body.password,
//     //   passwordConfirm: req.body.passwordConfirm,
//     //   gender: req.body.gender,
//     //   birthday: req.body.birthdate,
//     //   type: req.body.type,
//     //   product: 'free',
//     //   country: req.geoip.country
//     // });
//     res.status(200).json({
//       status: 'success',
//       data: {
//         // newUser
//         // user
//         artist
//       }
//     });
//   })
// );
module.exports = router;
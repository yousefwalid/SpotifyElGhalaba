const express = require('express');

const authenticationController = require('./../controllers/authenticationController');
// const userController = require('./../controllers/userController');

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

/*
 ##     ## ########    ########   #######  ##     ## ######## ########  ######  
 ###   ### ##          ##     ## ##     ## ##     ##    ##    ##       ##    ## 
 #### #### ##          ##     ## ##     ## ##     ##    ##    ##       ##       
 ## ### ## ######      ########  ##     ## ##     ##    ##    ######    ######  
 ##     ## ##          ##   ##   ##     ## ##     ##    ##    ##             ## 
 ##     ## ##          ##    ##  ##     ## ##     ##    ##    ##       ##    ## 
 ##     ## ########    ##     ##  #######   #######     ##    ########  ######  
*/

//This middleware will be applied on all routes that come after it
router.use(authenticationController.protect);

// router.get('/me', userController.getMe, userController.getUser);
// router.patch('/updateMe', userController.updateMe);
// router.delete('/deleteMe', userController.deleteMe);
router.patch('/updatePassword', authenticationController.updatePassword);

// router.route('/').post(async (req, res, next) => {
//   const user = req.body;

//   const newUser = await User.create(user);

//   res.status(200).json({
//     state: 'success',
//     data: {
//       newUser
//     }
//   });
// });

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
//     //   birthday: req.body.birthday,
//     //   birthmonth: req.body.birthmonth,
//     //   birthyear: req.body.birthyear,
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

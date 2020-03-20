/*
 
 ##     ##  #######  ########  ##     ## ##       ########  ######  
 ###   ### ##     ## ##     ## ##     ## ##       ##       ##    ## 
 #### #### ##     ## ##     ## ##     ## ##       ##       ##       
 ## ### ## ##     ## ##     ## ##     ## ##       ######    ######  
 ##     ## ##     ## ##     ## ##     ## ##       ##             ## 
 ##     ## ##     ## ##     ## ##     ## ##       ##       ##    ## 
 ##     ##  #######  ########   #######  ######## ########  ######  
 
*/

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const filterDoc = require('./../utils/filterDocument.js');

/*
 ##     ## ######## #### ##       #### ######## ##    ##    ######## ##     ## ##    ##  ######  ######## ####  #######  ##    ##  ######  
 ##     ##    ##     ##  ##        ##     ##     ##  ##     ##       ##     ## ###   ## ##    ##    ##     ##  ##     ## ###   ## ##    ## 
 ##     ##    ##     ##  ##        ##     ##      ####      ##       ##     ## ####  ## ##          ##     ##  ##     ## ####  ## ##       
 ##     ##    ##     ##  ##        ##     ##       ##       ######   ##     ## ## ## ## ##          ##     ##  ##     ## ## ## ##  ######  
 ##     ##    ##     ##  ##        ##     ##       ##       ##       ##     ## ##  #### ##          ##     ##  ##     ## ##  ####       ## 
 ##     ##    ##     ##  ##        ##     ##       ##       ##       ##     ## ##   ### ##    ##    ##     ##  ##     ## ##   ### ##    ## 
  #######     ##    #### ######## ####    ##       ##       ##        #######  ##    ##  ######     ##    ####  #######  ##    ##  ######  

 ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### #######
 ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### #######
*/
/*
  ######  ####  ######   ##    ##    ########  #######  ##    ## ######## ##    ## 
 ##    ##  ##  ##    ##  ###   ##       ##    ##     ## ##   ##  ##       ###   ## 
 ##        ##  ##        ####  ##       ##    ##     ## ##  ##   ##       ####  ## 
  ######   ##  ##   #### ## ## ##       ##    ##     ## #####    ######   ## ## ## 
       ##  ##  ##    ##  ##  ####       ##    ##     ## ##  ##   ##       ##  #### 
 ##    ##  ##  ##    ##  ##   ###       ##    ##     ## ##   ##  ##       ##   ### 
  ######  ####  ######   ##    ##       ##     #######  ##    ## ######## ##    ## 
*/
const signToken = id => {
  return jwt.sign(
    {
      id
    },
    process.env.JWT_SECRET,
    {
      //the secret string should be at least 32 characters long
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
};

/*
  ######  ########  ########    ###    ######## ########     ######  ######## ##    ## ########     ########  #######  ##    ## ######## ##    ## 
 ##    ## ##     ## ##         ## ##      ##    ##          ##    ## ##       ###   ## ##     ##       ##    ##     ## ##   ##  ##       ###   ## 
 ##       ##     ## ##        ##   ##     ##    ##          ##       ##       ####  ## ##     ##       ##    ##     ## ##  ##   ##       ####  ## 
 ##       ########  ######   ##     ##    ##    ######       ######  ######   ## ## ## ##     ##       ##    ##     ## #####    ######   ## ## ## 
 ##       ##   ##   ##       #########    ##    ##                ## ##       ##  #### ##     ##       ##    ##     ## ##  ##   ##       ##  #### 
 ##    ## ##    ##  ##       ##     ##    ##    ##          ##    ## ##       ##   ### ##     ##       ##    ##     ## ##   ##  ##       ##   ### 
  ######  ##     ## ######## ##     ##    ##    ########     ######  ######## ##    ## ########        ##     #######  ##    ## ######## ##    ## 
*/

const createAndSendToken = (user, statusCode, res) => {
  let id;

  //if the user is an artist (userInfo != undefined) then sign the token with his userInfo Id
  if (user.userInfo) id = user.userInfo._id;
  else id = user._id;
  const token = signToken(id);

  //Setting a cookie:-
  //   const cookieOptions = {
  //     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
  //     httpOnly: true
  //   };
  //   if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  //   res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

/*
 
  ######  ######## ##    ## ########     ##     ##  ######  ######## ########  
 ##    ## ##       ###   ## ##     ##    ##     ## ##    ## ##       ##     ## 
 ##       ##       ####  ## ##     ##    ##     ## ##       ##       ##     ## 
  ######  ######   ## ## ## ##     ##    ##     ##  ######  ######   ########  
       ## ##       ##  #### ##     ##    ##     ##       ## ##       ##   ##   
 ##    ## ##       ##   ### ##     ##    ##     ## ##    ## ##       ##    ##  
  ######  ######## ##    ## ########      #######   ######  ######## ##     ## 
 
*/
const sendUser = async (user, res) => {
  console.log('send user');
  if (user.type === 'artist') {
    const artist = await Artist.findOne({
      userInfo: new ObjectId(user._id)
    }).populate({
      path: 'userInfo'
    });

    const filteredArtist = filterDoc(
      artist,
      ['_id', 'external_urls', 'followers', 'genres', 'images', 'userInfo'],
      ['uri']
    );

    createAndSendToken(filteredArtist, 200, res);
  } else {
    const filteredUser = filterDoc(
      user,
      [
        '_id',
        'name',
        'email',
        'gender',
        'birthdate',
        'type',
        'product',
        'country',
        'image',
        'followers'
      ],
      ['uri']
    );
    createAndSendToken(filteredUser, 200, res);
  }
};

/*
 ########   #######  ##     ## ######## ########    ##     ##    ###    ##    ## ########  ##       ######## ########   ######  
 ##     ## ##     ## ##     ##    ##    ##          ##     ##   ## ##   ###   ## ##     ## ##       ##       ##     ## ##    ## 
 ##     ## ##     ## ##     ##    ##    ##          ##     ##  ##   ##  ####  ## ##     ## ##       ##       ##     ## ##       
 ########  ##     ## ##     ##    ##    ######      ######### ##     ## ## ## ## ##     ## ##       ######   ########   ######  
 ##   ##   ##     ## ##     ##    ##    ##          ##     ## ######### ##  #### ##     ## ##       ##       ##   ##         ## 
 ##    ##  ##     ## ##     ##    ##    ##          ##     ## ##     ## ##   ### ##     ## ##       ##       ##    ##  ##    ## 
 ##     ##  #######   #######     ##    ########    ##     ## ##     ## ##    ## ########  ######## ######## ##     ##  ######  

 ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### #######
 ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### #######
*/

/*
  ######  ####  ######   ##    ## ##     ## ########  
 ##    ##  ##  ##    ##  ###   ## ##     ## ##     ## 
 ##        ##  ##        ####  ## ##     ## ##     ## 
  ######   ##  ##   #### ## ## ## ##     ## ########  
       ##  ##  ##    ##  ##  #### ##     ## ##        
 ##    ##  ##  ##    ##  ##   ### ##     ## ##        
  ######  ####  ######   ##    ##  #######  ##        
*/
exports.signup = catchAsync(async (req, res, next) => {
  console.log('signup');
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    gender: req.body.gender,
    birthdate: req.body.birthdate,
    type: req.body.type,
    product: 'free',
    country: req.geoip.country
  });
  if (req.body.type === 'artist') {
    try {
      await Artist.create({
        userInfo: newUser._id
      });
    } catch (err) {
      await User.findOneAndDelete({
        _id: newUser._id
      });
      return next(err);
    }
  }
  sendUser(newUser, res);
});

/*
 
 ##        #######   ######   #### ##    ## 
 ##       ##     ## ##    ##   ##  ###   ## 
 ##       ##     ## ##         ##  ####  ## 
 ##       ##     ## ##   ####  ##  ## ## ## 
 ##       ##     ## ##    ##   ##  ##  #### 
 ##       ##     ## ##    ##   ##  ##   ### 
 ########  #######   ######   #### ##    ## 
 
*/

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('Please provide email and password!', 400));

  const user = await User.findOne({
    email: email
  }).select('+password');
  if (!user) return next(new AppError('Incorrect email or password', 400));
  const correct = await user.correctPassword(password, user.password);

  if (!correct) {
    return next(new AppError('Incorrect email or password', 400));
  }

  sendUser(user, res);
});

/*
 
 ########  ########   #######  ######## ########  ######  ######## 
 ##     ## ##     ## ##     ##    ##    ##       ##    ##    ##    
 ##     ## ##     ## ##     ##    ##    ##       ##          ##    
 ########  ########  ##     ##    ##    ######   ##          ##    
 ##        ##   ##   ##     ##    ##    ##       ##          ##    
 ##        ##    ##  ##     ##    ##    ##       ##    ##    ##    
 ##        ##     ##  #######     ##    ########  ######     ##    
 
*/

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];
  else
    return next(
      new AppError(`you're not logged in. Please login to get access`, 401)
    );

  //Check for the cookie
  //   if (req.cookies.jwt) {
  //     console.log(req.cookies.jwt);
  //   }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError(`The user that belongs to this token no longer exists`, 401)
    );

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        `User recently changed his password. Please login again`,
        401
      )
    );
  }

  // let filteredUser;
  // if (currentUser.type === 'artist') {
  //   const artist = await Artist.findOne({
  //     userInfo: new ObjectId(currentUser._id)
  //   }).populate({ path: 'userInfo' });

  //   filteredUser = filterDoc(
  //     artist,
  //     ['_id', 'external_urls', 'followers', 'genres', 'images', 'userInfo'],
  //     ['uri']
  //   );
  // } else {
  const filteredUser = filterDoc(currentUser, [
    '_id',
    'name',
    'email',
    'gender',
    'birthdate',
    'type',
    'product',
    'country',
    'image',
    'followers'
  ]);
  // }
  req.user = filteredUser;
  next();
});

/*
 
 ########  ########  ######  ######## ########  ####  ######  ########    ########  #######  
 ##     ## ##       ##    ##    ##    ##     ##  ##  ##    ##    ##          ##    ##     ## 
 ##     ## ##       ##          ##    ##     ##  ##  ##          ##          ##    ##     ## 
 ########  ######    ######     ##    ########   ##  ##          ##          ##    ##     ## 
 ##   ##   ##             ##    ##    ##   ##    ##  ##          ##          ##    ##     ## 
 ##    ##  ##       ##    ##    ##    ##    ##   ##  ##    ##    ##          ##    ##     ## 
 ##     ## ########  ######     ##    ##     ## ####  ######     ##          ##     #######  
 
*/

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`You do not have permession to perform this action`, 403)
      );
    }
    return next();
  };
};

/*
 
 ##     ##  ######  ######## ########     ###    ##     ## ######## ##     ## ######## ##    ## ######## ####  ######     ###    ######## ####  #######  ##    ## 
 ##     ## ##    ## ##       ##     ##   ## ##   ##     ##    ##    ##     ## ##       ###   ##    ##     ##  ##    ##   ## ##      ##     ##  ##     ## ###   ## 
 ##     ## ##       ##       ##     ##  ##   ##  ##     ##    ##    ##     ## ##       ####  ##    ##     ##  ##        ##   ##     ##     ##  ##     ## ####  ## 
 ##     ##  ######  ######   ########  ##     ## ##     ##    ##    ######### ######   ## ## ##    ##     ##  ##       ##     ##    ##     ##  ##     ## ## ## ## 
 ##     ##       ## ##       ##   ##   ######### ##     ##    ##    ##     ## ##       ##  ####    ##     ##  ##       #########    ##     ##  ##     ## ##  #### 
 ##     ## ##    ## ##       ##    ##  ##     ## ##     ##    ##    ##     ## ##       ##   ###    ##     ##  ##    ## ##     ##    ##     ##  ##     ## ##   ### 
  #######   ######  ######## ##     ## ##     ##  #######     ##    ##     ## ######## ##    ##    ##    ####  ######  ##     ##    ##    ####  #######  ##    ## 
 
*/

exports.userAuthorization = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) return next(new AppError('No document found with that ID', 401));

    if (!req.user._id.equals(doc.user._id) && !req.user._id.equals(doc.user)) {
      return next(
        new AppError('You are not authorized to do this action', 401)
      );
    }
    return next();
  });
};

/*
 
 ########  #######  ########   ######    #######  ######## ########     ###     ######   ######  ##      ##  #######  ########  ########  
 ##       ##     ## ##     ## ##    ##  ##     ##    ##    ##     ##   ## ##   ##    ## ##    ## ##  ##  ## ##     ## ##     ## ##     ## 
 ##       ##     ## ##     ## ##        ##     ##    ##    ##     ##  ##   ##  ##       ##       ##  ##  ## ##     ## ##     ## ##     ## 
 ######   ##     ## ########  ##   #### ##     ##    ##    ########  ##     ##  ######   ######  ##  ##  ## ##     ## ########  ##     ## 
 ##       ##     ## ##   ##   ##    ##  ##     ##    ##    ##        #########       ##       ## ##  ##  ## ##     ## ##   ##   ##     ## 
 ##       ##     ## ##    ##  ##    ##  ##     ##    ##    ##        ##     ## ##    ## ##    ## ##  ##  ## ##     ## ##    ##  ##     ## 
 ##        #######  ##     ##  ######    #######     ##    ##        ##     ##  ######   ######   ###  ###   #######  ##     ## ########  
 
*/

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(new AppError(`There is no user with this email`, 404));
  }
  const resetToken = user.createPasswordResetToken();

  await user.save({
    validateBeforeSave: false
  }); //To avoid the passwordConfirm field validation

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n
  If you didn't forget your password, please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (Valid for 10 mins)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({
      validateBeforeSave: false
    });
    return next(
      new AppError(
        `There was an error sending the email. Try again later.`,
        500
      )
    );
  }
});

/*
 
 ########  ########  ######  ######## ########    ########     ###     ######   ######  ##      ##  #######  ########  ########  
 ##     ## ##       ##    ## ##          ##       ##     ##   ## ##   ##    ## ##    ## ##  ##  ## ##     ## ##     ## ##     ## 
 ##     ## ##       ##       ##          ##       ##     ##  ##   ##  ##       ##       ##  ##  ## ##     ## ##     ## ##     ## 
 ########  ######    ######  ######      ##       ########  ##     ##  ######   ######  ##  ##  ## ##     ## ########  ##     ## 
 ##   ##   ##             ## ##          ##       ##        #########       ##       ## ##  ##  ## ##     ## ##   ##   ##     ## 
 ##    ##  ##       ##    ## ##          ##       ##        ##     ## ##    ## ##    ## ##  ##  ## ##     ## ##    ##  ##     ## 
 ##     ## ########  ######  ########    ##       ##        ##     ##  ######   ######   ###  ###   #######  ##     ## ########  
 
*/

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('SHA256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: {
      $gt: Date.now()
    }
  });

  if (!user) return next(new AppError(`Token is invalid or has expired`, 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  sendUser(user, res);
});

/*
 
 ##     ## ########  ########     ###    ######## ########    ########     ###     ######   ######  ##      ##  #######  ########  ########  
 ##     ## ##     ## ##     ##   ## ##      ##    ##          ##     ##   ## ##   ##    ## ##    ## ##  ##  ## ##     ## ##     ## ##     ## 
 ##     ## ##     ## ##     ##  ##   ##     ##    ##          ##     ##  ##   ##  ##       ##       ##  ##  ## ##     ## ##     ## ##     ## 
 ##     ## ########  ##     ## ##     ##    ##    ######      ########  ##     ##  ######   ######  ##  ##  ## ##     ## ########  ##     ## 
 ##     ## ##        ##     ## #########    ##    ##          ##        #########       ##       ## ##  ##  ## ##     ## ##   ##   ##     ## 
 ##     ## ##        ##     ## ##     ##    ##    ##          ##        ##     ## ##    ## ##    ## ##  ##  ## ##     ## ##    ##  ##     ## 
  #######  ##        ########  ##     ##    ##    ########    ##        ##     ##  ######   ######   ###  ###   #######  ##     ## ########  
 
*/

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError(`This user doesn't exist`, 400));

  if (!(await user.correctPassword(req.body.password, user.password)))
    return next(new AppError(`Incorrect password`, 401));

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  sendUser(user, res);
});

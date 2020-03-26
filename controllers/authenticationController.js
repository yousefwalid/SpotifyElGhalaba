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
// const setActiveDevice = async (user, deviceId) => {
//   if (user.devices.length > 0) {
//     await User.findOneAndUpdate(
//       { _id: user._id },
//       {
//         $set: { 'devices.$[].isActive': false }
//       }
//     );
//     user = await User.findOneAndUpdate(
//       { _id: user._id, 'devices._id': deviceId },
//       { $set: { 'devices.$.isActive': true } },
//       { new: true, runValidators: true }
//     );
//   }
//   return user;
// };

const setAllDevicesInactive = async user => {
  if (user.devices.length > 0) {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: { 'devices.$[].isActive': false }
      }
    );
  }
  return user;
};

const addDevice = async (user, device) => {
  if (user.devices.length < 3) {
    user = await User.findByIdAndUpdate(
      user._id,
      {
        $push: {
          devices: {
            name: device.client.name,
            type: device.device.type,
            isActive: true
          }
        }
      },
      { new: true, runValidators: true }
    );
  } else {
    let deviceId;

    for (let i = 0; i < 3; i += 1) {
      if (!user.devices[i].isActive) {
        deviceId = user.devices[i]._id;
        break;
      }
    }

    user = await User.findOneAndUpdate(
      {
        _id: user._id,
        'devices._id': deviceId
      },
      {
        $set: {
          'devices.$': {
            name: device.client.name,
            type: device.device.type,
            isActive: true
          }
        }
      },
      { new: true, runValidators: true }
    );
  }

  return user;
};

/*
  ######  ####  ######   ##    ##    ########  #######  ##    ## ######## ##    ## 
 ##    ##  ##  ##    ##  ###   ##       ##    ##     ## ##   ##  ##       ###   ## 
 ##        ##  ##        ####  ##       ##    ##     ## ##  ##   ##       ####  ## 
  ######   ##  ##   #### ## ## ##       ##    ##     ## #####    ######   ## ## ## 
       ##  ##  ##    ##  ##  ####       ##    ##     ## ##  ##   ##       ##  #### 
 ##    ##  ##  ##    ##  ##   ###       ##    ##     ## ##   ##  ##       ##   ### 
  ######  ####  ######   ##    ##       ##     #######  ##    ## ######## ##    ## 
*/
//params: user id
//returns: JWT token
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

//params:
//  user: user/artist object
//  statusCode: status code of the response
//  res: res
//Creates a token and sends the response containing the user object and the token.
//returns: none
const createAndSendToken = (user, statusCode, res) => {
  let id;

  //if the user is an artist (userInfo != undefined) then sign the token with his userInfo Id
  if (user.userInfo) id = user.userInfo._id;
  else id = user._id;
  const token = signToken(id);

  // Setting a cookie:-
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

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

//params:
//  user: user doc
//  res:  res object
//sends the user to the response
//returns: none
const sendUser = async (user, res) => {
  if (user.type === 'artist') {
    const artist = await Artist.findOne({
      userInfo: new ObjectId(user._id)
    }).populate({
      path: 'userInfo',
      select: User.publicUser()
    });

    //No need to filter artist fields [The nested user document is already filtered in the populate function]
    createAndSendToken(artist, 200, res);
  } else {
    //Filter private fields of the user and send only the public user
    const filteredUser = user.privateToPublic();
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
  if (!req.geoip || !req.geoip.country)
    return next(new AppError('Sorry... Cannot Read The Country Code'));

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

  let user = await User.findOne(
    {
      email: email
    },
    User.privateUser()
  );

  //INCORRECT EMAIL
  if (!user) return next(new AppError('Incorrect email or password', 400));

  const correct = await User.correctPassword(password, user.password);

  //INCORRECT PASSWORD
  if (!correct) {
    return next(new AppError('Incorrect email or password', 400));
  }

  //Check if a device is saved.
  //If not add device to db and send cookie to this new device and save the device to the req object
  // user = await addDevice(user, req.thisDevice);
  //set the device to be the active one in the db
  // user = await setActiveDevice(user, 2);

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
  //Check for JWT token in header or cookie or URL
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.query.authorization) {
    token = req.query.authorization;
  } else
    return next(
      new AppError(`you're not logged in. Please login to get access`, 401)
    );

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id, User.privateUser());

  if (!currentUser)
    return next(
      new AppError(`The user that belongs to this token no longer exists`, 401)
    );

  if (User.changedPasswordAfter(currentUser, decoded.iat)) {
    return next(
      new AppError(
        `User recently changed his password. Please login again`,
        401
      )
    );
  }

  //Send the public user info to the next middleware
  req.user = currentUser.privateToPublic();

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
    const doc = await Model.findById(req.params.id, User.publicUser());
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
  const user = await User.findOne(
    {
      email: req.body.email
    },
    User.privateUser()
  );
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
  if (!req.body.password || !req.body.passwordConfirm)
    return next(
      new AppError(
        `Please send a password and a passwordConfirm in the request body.`,
        400
      )
    );
  const hashedToken = crypto
    .createHash('SHA256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne(
    {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: {
        $gt: Date.now()
      }
    },
    User.privateUser()
  );

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
  const user = await User.findById(req.user._id).select(User.privateUser());
  if (!user) return next(new AppError(`This user doesn't exist`, 400));

  if (!(await User.correctPassword(req.body.password, user.password)))
    return next(new AppError(`Incorrect password`, 401));

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  sendUser(user, res);
});

/*
 ##      ## ######## ########      ######   #######   ######  ##    ## ######## ########  ######        ###    ##     ## ######## ##     ## ######## ##    ## ######## ####  ######     ###    ######## ####  #######  ##    ## 
 ##  ##  ## ##       ##     ##    ##    ## ##     ## ##    ## ##   ##  ##          ##    ##    ##      ## ##   ##     ##    ##    ##     ## ##       ###   ##    ##     ##  ##    ##   ## ##      ##     ##  ##     ## ###   ## 
 ##  ##  ## ##       ##     ##    ##       ##     ## ##       ##  ##   ##          ##    ##           ##   ##  ##     ##    ##    ##     ## ##       ####  ##    ##     ##  ##        ##   ##     ##     ##  ##     ## ####  ## 
 ##  ##  ## ######   ########      ######  ##     ## ##       #####    ######      ##     ######     ##     ## ##     ##    ##    ######### ######   ## ## ##    ##     ##  ##       ##     ##    ##     ##  ##     ## ## ## ## 
 ##  ##  ## ##       ##     ##          ## ##     ## ##       ##  ##   ##          ##          ##    ######### ##     ##    ##    ##     ## ##       ##  ####    ##     ##  ##       #########    ##     ##  ##     ## ##  #### 
 ##  ##  ## ##       ##     ##    ##    ## ##     ## ##    ## ##   ##  ##          ##    ##    ##    ##     ## ##     ##    ##    ##     ## ##       ##   ###    ##     ##  ##    ## ##     ##    ##     ##  ##     ## ##   ### 
  ###  ###  ######## ########      ######   #######   ######  ##    ## ########    ##     ######     ##     ##  #######     ##    ##     ## ######## ##    ##    ##    ####  ######  ##     ##    ##    ####  #######  ##    ## 
*/

const closeSocket = ws => {
  ws.send(
    'HTTP/1.1 401 Web Socket Protocol Handshake\r\n' +
      'Upgrade: WebSocket\r\n' +
      'Connection: Upgrade\r\n' +
      '\r\n'
  );
  ws.end();
};

exports.protectWs = async (req, ws) => {
  let token;
  if (req.query.Authorization && req.query.Authorization.startsWith('Bearer'))
    token = req.query.Authorization.split(' ')[1];
  else {
    return closeSocket(ws);
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return closeSocket(ws);
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return closeSocket(ws);
  }
  req.user = currentUser;
  // console.log(req.user);
  // ws.userId = currentUser._id;
  // console.log(req);
  // ws.write(
  //   'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
  //     'Upgrade: WebSocket\r\n' +
  //     'Connection: Upgrade\r\n' +
  //     '\r\n'
  // );
};

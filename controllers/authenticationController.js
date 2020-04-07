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
const {
  promisify
} = require('util');
const crypto = require('crypto');
const {
  ObjectId
} = require('mongoose').Types;
const User = require('./../models/userModel');
const Artist = require('./../models/artistModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

/*
 
  /*
 
  ######  ######## ########  ##     ## ####  ######  ########  ######  
 ##    ## ##       ##     ## ##     ##  ##  ##    ## ##       ##    ## 
 ##       ##       ##     ## ##     ##  ##  ##       ##       ##       
  ######  ######   ########  ##     ##  ##  ##       ######    ######  
       ## ##       ##   ##    ##   ##   ##  ##       ##             ## 
 ##    ## ##       ##    ##    ## ##    ##  ##    ## ##       ##    ## 
  ######  ######## ##     ##    ###    ####  ######  ########  ######  
 
 ####### ####### ####### ####### ####### ####### ####### ####### #######
 ####### ####### ####### ####### ####### ####### ####### ####### #######
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

/**
 * @description Sets all user devices active status to false
 * @param {Object} user The user document
 * @returns {UserObject}
 */
const setAllDevicesInactive = async user => {
  if (user.devices.length > 0) {
    await User.findOneAndUpdate({
      _id: user._id
    }, {
      $set: {
        'devices.$[].isActive': false
      }
    });
  }
  return user;
};

/**
 * @description Adds a device to users' devices
 * @param {Object} user The user document
 * @param {device} device The device object
 * @returns {UserObject}  The updated user object
 * @todo make the logic of adding devices for different users (user/artist)
 */
const addDevice = async (user, device) => {
  // if (user.devices.length < 3) {
  //   user = await User.findByIdAndUpdate(
  //     user._id,
  //     {
  //       $push: {
  //         devices: {
  //           name: device.client.name,
  //           type: device.device.type,
  //           isActive: true
  //         }
  //       }
  //     },
  //     { new: true, runValidators: true }
  //   );
  // } else {
  //   let deviceId;
  //   for (let i = 0; i < 3; i += 1) {
  //     if (!user.devices[i].isActive) {
  //       deviceId = user.devices[i]._id;
  //       break;
  //     }
  //   }
  //   user = await User.findOneAndUpdate(
  //     {
  //       _id: user._id,
  //       'devices._id': deviceId
  //     },
  //     {
  //       $set: {
  //         'devices.$': {
  //           name: device.client.name,
  //           type: device.device.type,
  //           isActive: true
  //         }
  //       }
  //     },
  //     { new: true, runValidators: true }
  //   );
  // }
  // return user;
};
/**
 * @description Gets the id of the first inactive device from the users' devices.
 * @param {Object} user The user document
 * @returns {deviceId}  The device id
 */
const getFirstInactiveDevice = user => {
  let deviceId;

  for (let i = 0; i < 3; i += 1) {
    if (!user.devices[i].isActive) {
      deviceId = user.devices[i]._id;
      break;
    }
  }
  return deviceId;
};

/**
 * @description Replaces a user device by another device.
 * @param {UserObject} user The user document.
 * @param {ObjectId} deviceId The id of the device to be replaced.
 * @param {Object} device The new device object.
 * @returns {UserObject}  The updated user document.
 */
const replaceUserDevice = async (user, deviceId, device) => {
  user = await User.findOneAndUpdate({
    _id: user._id,
    'devices._id': deviceId
  }, {
    $set: {
      'devices.$': {
        name: device.client.name,
        type: device.device.type,
        isActive: true
      }
    }
  }, {
    new: true,
    runValidators: true
  });
  return user;
};

/**
 * @description Creates a new user given his data.
 * @description Creates a corresponding artist to the user if the type is artist.
 * @param {Object} body Body object contains the user data.
 * @return {UserObject} The new user document.
 */
const createNewUser = async body => {
  const newUser = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
    passwordConfirm: body.passwordConfirm,
    gender: body.gender,
    birthdate: body.birthdate,
    type: body.type,
    product: 'free',
    country: body.country
  });
  if (body.type === 'artist') {
    try {
      await Artist.create({
        userInfo: newUser._id
      });
    } catch (err) {
      await User.findOneAndDelete({
        _id: newUser._id
      });
      throw err;
    }
  }
  return newUser;
};
exports.createNewUser = createNewUser;

/**
 * @description Check if the given email and password correspond to a user in the data base.
 * @param {String} email User email.
 * @param {String} password User password.
 * @return {UserObject} The user document.
 */
const checkEmailAndPassword = async (email, password) => {
  const user = await User.findOne({
      email: email
    },
    User.privateUser()
  );
  //INCORRECT EMAIL
  if (!user) throw new AppError('Incorrect email or password', 400);

  const correct = await User.correctPassword(password, user.password);

  //INCORRECT PASSWORD
  if (!correct) {
    throw new AppError('Incorrect email or password', 400);
  }
  return user;
};
exports.checkEmailAndPassword = checkEmailAndPassword;

/**
 * @description Extracts the jwt token from the request object and decodes it.
 * @param {Object} req The user document.
 * @return {Object} The decoded token object.
 */
const getDecodedToken = async req => {
  let token = null;
  //Check for JWT token in header or cookie or URL
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.query.Authorization &&
    req.query.Authorization.startsWith('Bearer')
  ) {
    token = req.query.Authorization.split(' ')[1];
  } else
    throw new AppError(`You're not logged in. Please login to get access`, 401);

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  return decoded;
};
exports.getDecodedToken = getDecodedToken;

/**
 * @description Gets the user from database given the id in the token.
 * @description Checks that the token is issued after the user's last password update.
 * @param {Object} token The decoded token object.
 * @return {Object} The user document.
 */
const getUserByToken = async token => {
  const user = await User.findById(token.id, User.privateUser());

  if (!user)
    throw new AppError(
      `The user that belongs to this token no longer exists`,
      401
    );

  if (User.changedPasswordAfter(user, token.iat)) {
    throw new AppError(
      `User recently changed his password. Please login again`,
      401
    );
  }
  return user;
};
exports.getUserByToken = getUserByToken;

/**
 * @description  Creates a new jwt token.
 * @param {ObjectId} id The id of the user.
 * @returns {String}  A json web token (JWT).
 */
const signToken = id => {
  return jwt.sign({
      id
    },
    process.env.JWT_SECRET, {
      //the secret string should be at least 32 characters long
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
};
exports.signToken = signToken;

/**
 *  @description Sends a mail to a certain user.
 * @param {String} email The user's email to send token to.
 * @param {String} baseURL The base url for the password reset link that is sent to the user.
 */
const sendResetToken = async (email, baseURL) => {
  const user = await User.findOne({
      email
    },
    User.privateUser()
  );
  if (!user) {
    throw new AppError(`There is no user with this email`, 404);
  }

  const resetToken = await user.createPasswordResetToken();

  const resetURL = `${baseURL}/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n
  If you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (Valid for 10 mins)',
      message
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({
      validateBeforeSave: false
    });
    throw new AppError(
      `There was an error sending the email. Try again later.`,
      500
    );
  }
};
exports.sendResetToken = sendResetToken;

/**
 * @description  Resets the user's password.
 * @param {String} token The password reset token that was sent to the user's email.
 * @param {String} password The new user's password
 * @param {String} passwordConfirm The new user's password confirmation.
 * @returns {UserObject} User document
 */
const resetPassword = async (token, password, passwordConfirm) => {
  const hashedToken = crypto
    .createHash('SHA256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: {
        $gt: Date.now()
      }
    },
    User.privateUser()
  );

  if (!user) throw new AppError(`Token is invalid or has expired`, 400);

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  return user;
};
exports.resetPasswordService = resetPassword;

/**
 * @description Updates an authenticated user's password
 * @param {ObjectId} id User Id
 * @param {String} pass User password
 * @param {String} newPass User new password
 * @param {String} newPassConfirm User new password confirmaion
 */
const updatePassword = async (id, pass, newPass, newPassConfirm) => {
  const user = await User.findById(id).select(User.privateUser());
  if (!user) throw new AppError(`This user doesn't exist`, 400);

  if (!(await User.correctPassword(pass, user.password)))
    throw new AppError(`Incorrect password`, 401);

  user.password = newPass;
  user.passwordConfirm = newPassConfirm;
  await user.save();

  return user;
};
exports.updatePasswordService = updatePassword;

/**
 * @description Assings a token to the user and Sends the user data by the res object.
 * @param {UserObject} user The user document.
 * @param {Number} statusCode  The status code of the response.
 * @param {Object} res  The response object.
 */
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
    httpOnly: true,
    sameSite: false //Has to be 'None' [It's a bug in express (waiting for it to be solved)]
  };

  // if (process.env.NODE_ENV === 'production')
  // cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  cookieOptions.httpOnly = false;
  res.cookie('loggedIn', true, cookieOptions);
  // res.setHeader('Access-Control-Allow-Origin', req.);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.createAndSendToken = createAndSendToken;

/**
 * Checks the user type, populates his fields, filters private fields and return the new document.
 * @param {UserObject} user The user doument
 * @returns {Object}  returns the populated public user/artist object.
 */
const getPublicUser = async user => {
  let populatedUser;
  if (user.type === 'artist') {
    populatedUser = await Artist.findOne({
      userInfo: new ObjectId(user._id)
    }).populate({
      path: 'userInfo',
      select: User.publicUser()
    });
    populatedUser = populatedUser.toObject({
      virtuals: true
    });
  } else {
    //Filter private fields of the user and send only the public user
    populatedUser = user.privateToPublic();
  }
  return populatedUser;
};
exports.getPublicUser = getPublicUser;

/**
 * @description Sends the result to the response object
 * @param {UserObject} user The user document.
 * @param {Object} res  The response object.
 */
const sendUser = async (user, res) => {
  const sentUser = await getPublicUser(user);
  createAndSendToken(sentUser, 200, res);
};
exports.sendUser = sendUser;

/**
 * @description Protect middleware
 * @param {Object} req Request object.
 */
const protect = async req => {
  //Get the token from the request header or cookie or url.
  const decodedToken = await getDecodedToken(req);

  //Get the user by the data in the decoded token.
  const user = await getUserByToken(decodedToken);

  //Send the public user info to the next middleware
  req.user = user.privateToPublic();
};
exports.protectService = protect;

/**
 * @description Closes the websocket connection.
 * @param {Object} ws Websocket object
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
exports.closeSocket = closeSocket;

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
  //Creates a new user. If the type is artist, creates a referencing artist.
  if (!req.body.password || !req.body.passwordConfirm)
    throw new AppError('Password is required to sign up');
  const newUser = await createNewUser(req.body);
  //Send the new User in the response.
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
  const {
    email,
    password
  } = req.body;
  if (!email || !password)
    throw new AppError('Please provide email and password!', 400);

  //Check if the given email and password exist in the databse.
  const user = await checkEmailAndPassword(email, password);

  //Send the new User in the response.
  sendUser(user, res);
});

exports.loginWithFacebook = catchAsync(async (req, res, next) => {
  const token = signToken(req.user._id);

  // Setting a cookie:-
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  cookieOptions.httpOnly = false;
  res.cookie('loggedIn', true, cookieOptions);

  res.redirect(process.env.FRONTEND_URL);


});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie('jwt');
  res.clearCookie('loggedIn');
  res.json(200).json('done');
});


exports.getToken = catchAsync(async (req, res, next) => {

  const token = signToken(req.user._id);
  res.status(200).json({
    token
  });
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
  await protect(req);

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

exports.restrictTo = (...types) => {
  return (req, res, next) => {
    if (!types.includes(req.user.type)) {
      return next(
        new AppError(`You do not have permession to perform this action`, 403)
      );
    }
    return next();
  };
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
  const baseURL = `${req.protocol}://${req.get('host')}${
    req.baseApiUrl
  }/resetPassword`;

  await sendResetToken(req.body.email, baseURL);

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!'
  });
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

  const user = await resetPassword(
    req.params.token,
    req.body.password,
    req.body.passwordConfirm
  );

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
  const user = await updatePassword(
    req.user._id,
    req.body.password,
    req.body.newPassword,
    req.body.newPasswordConfirm
  );
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

exports.protectWs = async (req, ws) => {
  try {
    await protect(req);
  } catch {
    closeSocket(ws);
  }
};
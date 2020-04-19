const assert = require('assert');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const faker = require('faker');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { dropDB } = require('./../utils/dropDB');
const authenticationController = require('../controllers/authenticationController');

const Artist = require('./../models/artistModel');
const User = require('./../models/userModel');

const objectBody = require('./utils/createUser');

const userBody = objectBody('user');
const artistBody = objectBody('artist');

const userDefaultEmptyArrays = ['devices', 'followedPlaylists', 'following'];
const userDefaultProperties = {
  online: false,
  followers: 0,
  image: null
};
const userDefaultNestedObjects = {
  currentlyPlaying: {
    track: null,
    timestamp: null,
    repeat_state: false,
    shuffle_state: false,
    volume_percent: 60,
    is_playing: false,
    progress_ms: 0
  }
};

const createUserAssertions = function(user, body) {
  assert.ok(user !== undefined, 'The User Document Was Not Created In DB');
  Object.keys(body).forEach(async property => {
    if (property === 'email')
      assert.ok(
        body[property].toLocaleLowerCase() === user[property],
        `The Created User Document Does Not Contain Or Has A Wrong Value For ${property}`
      );
    else if (property === 'password')
      assert.ok(
        await bcrypt.compare(body[property], user[property]),
        `The Created User Document Does Not Contain Or Has A Wrong Value For ${property}`
      );
    else if (property === 'passwordConfirm')
      assert.ok(!user[property], 'The passwordConfirm is saved in the DB!!');
    else if (property === 'birthdate') {
      assert.ok(
        body[property].getTime() === user[property].getTime(),
        'The passwordConfirm is saved in the DB!!'
      );
    } else
      assert.ok(
        body[property] === user[property],
        `The Created User Document Does Not Contain Or Has A Wrong Value For ${property}`
      );
  });

  Object.keys(userDefaultProperties).forEach(property => {
    assert.ok(
      userDefaultProperties[property] === user[property],
      `The Created User Document Does Not Contain Or Has A Wrong Value For ${property}`
    );
  });

  Object.keys(userDefaultNestedObjects).forEach(property => {
    const nestedObj = userDefaultNestedObjects[property];
    Object.keys(nestedObj).forEach(prop => {
      assert.ok(
        nestedObj[prop] === user[property][prop],
        `The Created User Document Does Not Contain Or Has A Wrong Value For ${prop} in ${property}`
      );
    });
  });

  userDefaultEmptyArrays.forEach(property => {
    assert.ok(
      !(user[property] === undefined) && user[property].length === 0,
      `The Created User Document Does Not Contain Or Has A Wrong Value For ${property}`
    );
  });
};

let userUser; //A normal user
let userArtist; //The user object (userinfo) of the artist
let artistArtist; //The artist object of the artist
describe('Testing Authentication Services', function() {
  this.beforeAll('Authentication', async () => {
    await dropDB();

    userUser = await User.create(userBody);
    userArtist = await User.create(artistBody);
    const artistArtist = await Artist.create({
      userInfo: userArtist._id
    });
  });

  describe('Testing Create New User/Artist', function() {
    it('Should create a new user without error', async function() {
      const newUserBody = objectBody('user');
      const newUser = await authenticationController.createNewUser(newUserBody);

      createUserAssertions(newUser, newUserBody);
    });

    it('Should create a new artist without error', async function() {
      const newArtistBody = objectBody('artist');
      const newArtist = await authenticationController.createNewUser(
        newArtistBody
      );
      createUserAssertions(newArtist, newArtistBody);
      const artist = await Artist.findOne({
        userInfo: newArtist._id
      });

      assert.ok(artist, 'The Artist Document Was Not Created In DB');
    });
  });

  describe('Testing public user', function() {
    it('Should return the public user info without error', async function() {
      const user = await userUser.privateToPublic();

      const publicUser = User.publicUser();
      // user.password = '123456';
      Object.keys(publicUser).forEach(key => {
        assert.ok(
          !user[key],
          `The private property ${key} exists in  public user!`
        );
      });
    });
    it('Should return the public user info without error', async function() {
      const user = await authenticationController.getPublicUser(userUser);
      //Same as:
      //const user = await userUser.privateToPublic();

      const publicUser = User.publicUser();
      // user.password = '123456';
      Object.keys(publicUser).forEach(key => {
        assert.ok(
          !user[key],
          `The private property ${key} exists in  public user!`
        );
      });

      //Same for artist
      const artist = await authenticationController.getPublicUser(userArtist);
      // user.password = '123456';
      Object.keys(publicUser).forEach(key => {
        assert.ok(
          !artist.userInfo[key],
          `The private property ${key} exists in  public artist!`
        );
      });
    });
  });

  describe('Testing Email and Password Check', function() {
    it('Should check without error', async function() {
      const user = await authenticationController.checkEmailAndPassword(
        userBody.email,
        userBody.password
      );

      //Check that an artist is created in the db
      assert.ok(user, 'No User Was Found With The Given EMAIL AND PASS');
    });
    it('Should throw error for wrong email or password', async function() {
      assert.rejects(async () => {
        await authenticationController.checkEmailAndPassword(
          userBody.email,
          'A wrong password&^%^'
        );
      }, 'An expected error is not thrown');

      assert.rejects(async () => {
        await authenticationController.checkEmailAndPassword(
          'A wrong user email*%',
          userBody.password
        );
      }, 'An expected error is not thrown');
    });
  });

  describe('Check JWT token functions', function() {
    let token;
    let decodedToken;
    it('Should check that the token exists in the req header/cookie/query and return without error', async function() {
      token = jwt.sign(
        {
          id: userUser._id
        },
        process.env.JWT_SECRET,
        {
          //the secret string should be at least 32 characters long
          expiresIn: process.env.JWT_EXPIRES_IN
        }
      );
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        },
        cookies: {},
        query: {}
      };

      decodedToken = await authenticationController.getDecodedToken(req);
      assert.ok(
        decodedToken.id === userUser._id.toString(),
        'The Token was not found in req.headers'
      );
      delete req.headers.authorization;
      req.cookies.jwt = token;
      decodedToken = await authenticationController.getDecodedToken(req);
      assert.ok(
        decodedToken.id === userUser._id.toString(),
        'The Token was not found in req.cookies'
      );
      delete req.cookies.jwt;
      req.query.Authorization = `Bearer ${token}`;
      decodedToken = await authenticationController.getDecodedToken(req);
      assert.ok(
        decodedToken.id === userUser._id.toString(),
        'The Token was not found in req.query'
      );
    });

    it('Should check that the user with the decodedToken in the previous step exists.', async function() {
      const user = await authenticationController.getUserByToken(decodedToken);
      assert.ok(
        user._id.equals(userUser._id),
        `The decoded token id does not match the user's id`
      );
    });

    it('Should check that the jwt token is invalid if the password changed after signing it', async function() {
      //Change password in userBody then assign it to the update function
      userBody.password = 'a new passworddd';
      userBody.passwordConfirm = 'a new passworddd';
      userUser = await User.findById(userUser._id).select(User.privateUser());
      assert.ok(userUser, 'Could not update the user in the db');

      userUser.password = userBody.password;
      userUser.passwordConfirm = userBody.passwordConfirm;
      userUser = await userUser.save();

      const userChangedPassAfterToken = User.changedPasswordAfter(
        userUser,
        decodedToken.iat
      );

      assert.ok(
        userChangedPassAfterToken,
        `Although the user changed his password after signing the jwt token, this function could not figure this out. `
      );
    });

    it('Should throw an error if no token exists in the request object', async function() {
      const req = { headers: {}, query: {}, cookies: {} };
      assert.rejects(async () => {
        await authenticationController.getDecodedToken(req);
      }, 'An expected error is not thrown');
    });
    it('Should thorw an error if token id is invalid', async function() {
      // This will throw error because the decoded id cannot be parsed to object id to query the user from db.
      decodedToken.id = 'Invalid user id';
      decodedToken.iat = Math.round(Date.now() / 1000);
      assert.rejects(async () => {
        await authenticationController.getUserByToken(decodedToken);
      }, 'An expected error is not thrown (due to invalid user id in the token)');

      // This will throw error because the decoded id is not in the db.
      //mongoose.Types.ObjectId()  Generates a new random object id
      decodedToken.id = mongoose.Types.ObjectId();
      decodedToken.iat = Math.round(Date.now() / 1000);
      assert.rejects(async () => {
        await authenticationController.getUserByToken(decodedToken);
      }, 'An expected error is not thrown (due to invalid user id in the token)');
    });

    it('Should throw an error because the password changed after signing the token', async function() {
      decodedToken.id = userUser._id;
      decodedToken.iat = Math.round(Date.now() / 1000);

      userBody.password = 'a brand new password';
      userBody.passwordConfirm = 'a brand new password';
      userUser.password = userBody.password;
      userUser.passwordConfirm = userBody.passwordConfirm;
      userUser = await userUser.save();
      assert.rejects(async () => {
        await authenticationController.getUserByToken(decodedToken);
      }, 'An expected error is not thrown');
    });
  });

  describe('Test User Methods', function() {
    it('Should check if a given password match the hashed password', async function() {
      const correct = await User.correctPassword(
        userBody.password,
        // '1123499999',
        userUser.password
      );
      assert.ok(
        correct,
        `The given password does not match the user's password`
      );
    });

    it('Should create password reset token and return it without error', async function() {
      const resetToken = await userUser.createPasswordResetToken();
      const hashedToken = crypto
        .createHash('SHA256')
        .update(resetToken)
        .digest('hex');

      userUser = await User.findById(userUser._id);

      assert.ok(
        hashedToken === userUser.passwordResetToken,
        `The user's password reset token does not match the returned token`
      );
      assert.ok(
        userUser.passwordResetExpiresAt,
        'The passwordResetExpiresAt proprty was not set'
      );
    });
  });

  describe(`Testing user's Update  password`, function() {
    //Change password in userBody then assign it to the update function
    it('Should check that the password is updated without errors.', async function() {
      const oldPass = userBody.password; //The unhashed password
      userBody.password = 'a new passworddd2222';
      userBody.passwordConfirm = 'a new passworddd2222';

      userUser = await authenticationController.updatePasswordService(
        userUser._id,
        oldPass,
        userBody.password,
        userBody.passwordConfirm
      );

      assert.ok(
        userUser,
        `There was a problem in updating the user's password`
      );

      const correct = await bcrypt.compare(
        userBody.password,
        // '12345678',
        userUser.password
      );
      assert.ok(
        correct,
        `The entered password does not match the updated password`
      );
    });

    it(`Should reset user's password given a previously embedded resetToken in the user Correctly without errors.`, async function() {
      //First create a reset token and set it in the user
      const resetToken = crypto.randomBytes(32).toString('hex');
      userUser.passwordResetToken = crypto
        .createHash('SHA256')
        .update(resetToken)
        .digest('hex');
      userUser.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;
      await userUser.save({
        //To avoid the passwordConfirm field validation
        validateBeforeSave: false
      });
      const password = '123abcxyzT';
      const returnedUser = await authenticationController.resetPasswordService(
        resetToken,
        password,
        password
      );
      userUser = await User.findById(userUser._id, User.privateUser());
      assert.ok(
        await bcrypt.compare(password, userUser.password),
        'The resetPassword Service Does Not Work Properly'
      );
    });
    it('Should throw error if the hashed token is invalid', async function() {
      const resetToken1 = crypto.randomBytes(32).toString('hex');
      const resetToken2 = crypto.randomBytes(32).toString('hex');
      userUser.passwordResetToken = crypto
        .createHash('SHA256')
        .update(resetToken1)
        .digest('hex');
      userUser.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;
      await userUser.save({
        //To avoid the passwordConfirm field validation
        validateBeforeSave: false
      });
      assert.rejects(async () => {
        await authenticationController.resetPasswordService(
          resetToken2,
          userBody.password,
          userUser.passwordConfirm
        );
      }, 'An expected error is not thrown');
    });
    it('Should throw error if the old password is incorrect', async function() {
      assert.rejects(async () => {
        await authenticationController.updatePasswordService(
          userUser._id,
          'invalid old passworddd',
          'a new passsss',
          'a new passsss'
        );
      }, 'An expected error is not thrown.');
    });
    it('Should throw error if the user whose password is to be updated, does not exist in db', async function() {
      assert.rejects(async () => {
        await authenticationController.updatePasswordService(
          mongoose.Types.ObjectId(),
          userBody.password,
          'a new passsss',
          'a new passsss'
        );
      }, 'An expected error is not thrown.');
    });
  });
});

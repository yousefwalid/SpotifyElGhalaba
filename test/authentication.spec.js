const assert = require('assert');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const connectDB = require('./connectDB');
const disconnectDB = require('./disconnectDB');
const { dropDB } = require('./dropDB');
const authenticationController = require('../controllers/authenticationController');

const Artist = require('./../models/artistModel');
const User = require('./../models/userModel');

const userBody = require('./utils/createUser')('user');
const artistBody = require('./utils/createUser')('artist');

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

describe.only('Testing Authentication Services', function() {
  this.beforeAll(async () => {
    await connectDB();
    await dropDB();

    // console.log(userBody);
    // console.log(userDefaultProperties);
    // console.log(userDefaultNestedObjects);
  });

  let userUser, userArtist;

  describe('Testing Create New User/Artist', function() {
    it('Should create a new user without error', async function() {
      userUser = await authenticationController.createNewUser(userBody);
      // user = await authenticationController.getPublicUser(user);
      // console.log(user);

      createUserAssertions(userUser, userBody);
    });

    it('Should create a new artist without error', async function() {
      // console.log(artistBody);
      userArtist = await authenticationController.createNewUser(artistBody);
      createUserAssertions(userArtist, artistBody);
      const artist = await Artist.findOne({ userInfo: userArtist._id });

      //Check that an artist is created in the db
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
  });

  describe('Check JWT token functions', function() {
    let token;
    let decodedToken;
    it('Should check that the token exists in the req header/cookie/query and return without error', async function() {
      token = authenticationController.signToken(userUser._id);
      const req = {
        headers: { authorization: `Bearer ${token}` },
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
  });

  this.afterAll(async () => {
    await disconnectDB();
  });
});

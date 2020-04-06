const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('./models/userModel');

// passport.serializeUser((user, done) => {
//     console.log(user);
//     done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//     const user = await User.findById(id);
//     done(null, user);
// });

passport.use(
  new GoogleStrategy(
    {
      //options for this strategy
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/v1/authentication/google/redirect'
    },
    async function(accessToken, refreshToken, profile, cb) {
      const profileInfo = profile._json;

      await User.create({
        name: profileInfo.name,
        googleId: profile.id,
        gender: 'm',
        birthdate: '2000-1-1',
        email: profileInfo.email,
        image: {
          width: 100,
          height: 100,
          url: profileInfo.picture
        },
        password: '12345678',
        passwordConfirm: '12345678'
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: '/api/v1/authentication/facebook/redirect',
      profileFields: [
        'id',
        'email',
        'gender',
        'link',
        'name',
        'birthday',
        'location',
        'picture'
      ]
    },
    async function(accessToken, refreshToken, profile, done) {
      const { _json: profileInfo } = profile;

      const newUser = {
        name: `${profileInfo.first_name} ${profileInfo.last_name}`,
        email: profileInfo.email,
        gender: profileInfo.gender === 'male' ? 'm' : 'f',
        birthdate: profileInfo.birthday,
        facebookId: profile.id
      };

      let user = await User.findOne({
        facebookId: profile.id
      });

      if (!user) user = await User.create(newUser);

      done(null, user); //send the user to be serialized
    }
  )
);

module.exports = passport;

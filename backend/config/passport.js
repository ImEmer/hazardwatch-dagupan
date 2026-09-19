import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) return done(new Error('Google account did not provide an email address.'));

    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    user = await User.findOne({ email });
    if (user) {
      user.googleId = profile.id;
      user.authProvider = 'google';
      await user.save({ validateBeforeSave: false });
      return done(null, user);
    }

    user = await User.create({
      name: (profile.displayName || email.split('@')[0]).slice(0, 50),
      email,
      googleId: profile.id,
      authProvider: 'google',
      role: 'user',
      isActive: true,
      status: 'active',
    });
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (error) {
    done(error);
  }
});

export default passport;
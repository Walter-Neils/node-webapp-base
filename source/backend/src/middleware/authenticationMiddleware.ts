import * as PassportLocal from 'passport-local';
import passport from 'passport';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';
import { PrivateUserProfile } from '../clientShared/UserInterface.js';
import { ObjectId, WithId } from 'mongodb';
import { logger } from '../core/logging.js';

const userCollection = getTypedMongoCollection('users', 'auth');

passport.use(
	new PassportLocal.Strategy(async (username, password, done) => {
		const user = await userCollection.findOne({ username });
		if (user === null) {
			logger.info(`Failed login attempt for user ${username}`);
			return done(null, false, { message: 'Incorrect username.' });
		}
		if (user.password !== password) {
			logger.info(`Failed login attempt for user ${username}`);
			return done(null, false, { message: 'Incorrect password.' });
		}
		logger.info(`Successful login attempt for user ${username}`);
		return done(null, user);
	}),
);
passport.serializeUser((_user, done) => {
	const user = _user as WithId<PrivateUserProfile>;
	console.log('serializeUser', user);
	done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
	const user = await userCollection.findOne({ _id: id as ObjectId });
	if (user === null) {
		done('Failed to find user', null);
	} else {
		done(null, user);
	}
});

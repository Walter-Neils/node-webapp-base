import * as PassportLocal from 'passport-local';
import passport from 'passport';
import {
	MongoDatabaseSchema,
	getTypedMongoCollection,
} from '../data/MongoConnectionManager.js';
import { WithId } from 'mongodb';
import { logger } from '../core/logging.js';
import generateGUID from '../misc/Guid.js';
import { expressApp } from '../core/express.js';
// Hashing passwords
import bcrypt from 'bcrypt';

const userCollection = getTypedMongoCollection('users', 'auth');

export function hashPassword(password: string) {
	return bcrypt.hashSync(password, 10);
}

function checkPassword(password: string, hash: string) {
	return bcrypt.compareSync(password, hash);
}

passport.use(
	new PassportLocal.Strategy(async (username, password, done) => {
		const user = await userCollection.findOne({ username });
		if (user === null) {
			logger.warn(`User ${username} failed to log in (user not found)`);
			return done(null, false, { message: 'Incorrect username.' });
		}
		// Check password
		if (!checkPassword(password, user.password)) {
			logger.warn(`User ${username} failed to log in (wrong password)`);
			return done(null, false, { message: 'Incorrect password.' });
		}
		user.sessionToken = generateGUID();
		userCollection.updateOne(
			{ _id: user._id },
			{ $set: { sessionToken: user.sessionToken } },
		);
		logger.info(
			`User ${user.username} logged in (sessionToken: ${user.sessionToken})`,
		);
		return done(null, user);
	}),
);
passport.serializeUser((_user, done) => {
	const user = _user as WithId<MongoDatabaseSchema['users.auth']>;
	done(null, user.sessionToken);
});

passport.deserializeUser(async (id, done) => {
	const user = await userCollection.findOne({ sessionToken: id as string });
	if (user === null) {
		done('Failed to find user', null);
	} else {
		done(null, user);
	}
});

// TODO: Check performance of this
expressApp.use(passport.authenticate('session')); // Authenticate all requests

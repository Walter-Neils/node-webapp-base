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

function hashPassword(password: string) {
	return bcrypt.hashSync(password, 'keyboard cat');
}

passport.use(
	new PassportLocal.Strategy(async (username, password, done) => {
		const user = await userCollection.findOne({ username });
		if (user === null) {
			return done(null, false, { message: 'Incorrect username.' });
		}
		if (user.password !== hashPassword(password)) {
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

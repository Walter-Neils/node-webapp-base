import * as PassportLocal from 'passport-local';
import passport from 'passport';
import {
	MongoDatabaseSchema,
	getTypedMongoCollection,
} from '../data/MongoConnectionManager.js';
import { ObjectId, WithId } from 'mongodb';
import { logger } from '../core/logging.js';
import { expressApp } from '../core/express.js';
// Hashing passwords
import bcrypt from 'bcrypt';

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.sessionTokens': {
			user: ObjectId;
			sessionToken: string;
			validUntil: Date;
		};
	}
}

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

		return done(null, user);
	}),
);
passport.serializeUser((_user, done) => {
	const user = _user as WithId<MongoDatabaseSchema['users.auth']>;
	done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
	const user = await userCollection.findOne({
		_id: new ObjectId(id as unknown as string),
	});
	if (user === null) {
		done('Failed to find user', null);
	} else {
		done(null, user);
	}
});

// TODO: Check performance of this
expressApp.use(passport.authenticate('session')); // Authenticate all requests

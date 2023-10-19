import { expressApp } from '../core/express.js';
// Passport
import passport from 'passport';
import {
	MongoDatabaseSchema,
	getTypedMongoCollection,
} from '../data/MongoConnectionManager.js';
import { WithId } from 'mongodb';
import { hashPassword } from '../middleware/authenticationMiddleware.js';
declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.auth': {
			username: string;
			password: string;
		};
	}
}

const userCollection = getTypedMongoCollection('users', 'auth');
expressApp.post(
	'/api/core/auth/login',
	passport.authenticate('local'),
	async (req, res) => {
		if (req.user !== undefined) {
			const user = req.user;
			await new Promise<void>((resolve, reject) =>
				req.login(user, err => {
					if (err) reject(err);
					else resolve();
				}),
			);
			res.standardFormat.success.json(req.user);
		} else {
			res.standardFormat.error.json(new Error('Failed to login'));
		}
	},
);

expressApp.post('/api/core/auth/createAccount', async (req, res) => {
	const username: string = req.body.username;
	let password: string = req.body.password;
	if (typeof username !== 'string' || typeof password !== 'string') {
		res.standardFormat.error.json(new Error('Invalid request'));
		return;
	}
	password = hashPassword(password);
	const user = await userCollection.findOne({ username });
	if (user !== null) {
		res.standardFormat.error.json(new Error('User already exists'));
		return;
	}
	const newUser: MongoDatabaseSchema['users.auth'] = {
		username,
		password,
	};
	const result = await userCollection.insertOne(
		newUser as WithId<MongoDatabaseSchema['users.auth']>,
	);
	res.standardFormat.success.json(result.insertedId);
});

expressApp.get('/api/core/auth/currentUser', (req, res) => {
	res.standardFormat.success.json(req.user);
});

expressApp.post('/api/core/auth/logout', (req, res) => {
	req.logout(err => {
		if (err) {
			res.standardFormat.error.json(err);
		} else {
			res.standardFormat.success.json(true);
		}
	});
});

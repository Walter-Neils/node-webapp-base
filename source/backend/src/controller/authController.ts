import { PrivateUserProfile } from '../clientShared/UserInterface.js';
import { expressApp } from '../core/express.js';
// Passport
import passport from 'passport';
import {
	MongoDatabaseSchema,
	getTypedMongoCollection,
} from '../data/MongoConnectionManager.js';
import { WithId } from 'mongodb';
declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.auth': {
			password: string;
			sessionToken: string;
		} & PrivateUserProfile & {
				sessionToken: string;
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
	const { username, password } = req.body;
	const user = await userCollection.findOne({ username });
	if (user !== null) {
		res.standardFormat.error.json(new Error('User already exists'));
		return;
	}
	const newUser: MongoDatabaseSchema['users.auth'] = {
		username,
		password,
		displayName: username,
		email: '',
		profilePictureURL: '',
		permissions: [],
		sessionToken: '',
		handle: username,
	};
	await userCollection.insertOne(
		newUser as WithId<MongoDatabaseSchema['users.auth']>,
	);
	res.standardFormat.success.json('Success');
});

expressApp.get('/api/core/auth/currentUser', (req, res) => {
	res.send({ user: req.user });
	res.end();
});

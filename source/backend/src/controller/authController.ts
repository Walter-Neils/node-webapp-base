import { PrivateUserProfile } from '../clientShared/UserInterface.js';
import { expressApp } from '../core/express.js';
// Passport
import passport from 'passport';
declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.auth': {
			password: string;
			sessionToken: string;
		} & PrivateUserProfile;
	}
}
expressApp.post(
	'/api/core/auth/login',
	passport.authenticate('local'),
	async (req, res, next) => {
		if (req.user !== undefined) {
			res.standardFormat.success.json(req.user);
		} else {
			res.standardFormat.error.json(new Error('Failed to login'));
		}
	},
);

expressApp.get('/api/core/auth/currentUser', (req, res) => {
	res.send({ user: req.user ?? 'NOT_LOGGED_IN' });
	res.end();
});

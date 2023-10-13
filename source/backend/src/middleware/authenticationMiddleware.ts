import { expressApp } from '../core/express.js';
import {
	MongoDatabaseSchema,
	getTypedMongoCollection,
} from '../data/MongoConnectionManager.js';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user?: MongoDatabaseSchema['users.auth'];
		}
	}
}

const userCollection = getTypedMongoCollection('users', 'auth');

expressApp.use(async (req, res, next) => {
	if (req.cookies.session) {
		const user = (
			await userCollection
				.find({
					sessionToken: req.cookies.session,
				})
				.toArray()
		)[0];

		if (user) {
			req.user = user;
		}
	}

	next();
});

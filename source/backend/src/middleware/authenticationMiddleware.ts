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

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.auth': {
			username: string;
			password: string;
			sessionToken: string;
		};
	}
}

getTypedMongoCollection('users', 'auth');

import { MongoDatabaseSchema } from '../data/MongoConnectionManager.js';

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		auth: {
			users: {
				username: string;
				password: string;
				profilePictureURL?: string;
			};
		};
	}
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user?: MongoDatabaseSchema['auth']['users'];
		}
	}
}

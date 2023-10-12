import { MongoDatabaseSchema } from '../data/MongoConnectionManager.js';
import { ExpressSession, expressSessionEvents } from './sessionMiddleware.js';

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
			profilePictureURL?: string;
		};
	}
}

declare module './sessionMiddleware.js' {
	interface ExpressSession {
		count: number;
	}
}

const handler: (session: ExpressSession) => void = session => {
	if (session.count === undefined) {
		session.count = 0;
	}
};

expressSessionEvents.addEventListener('session-init', handler);
expressSessionEvents.addEventListener('session-retrieve', handler);

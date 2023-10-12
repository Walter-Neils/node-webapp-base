import EventEmitter from 'events';
import { expressApp } from '../core/express.js';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';
import generateGUID from '../misc/Guid.js';
import TypedEventEmitter from '../misc/TypedEventListener.js';

export interface ExpressSession {}

interface SessionOptions {
	save: () => Promise<void>;
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			session: ExpressSession & SessionOptions;
		}
	}
}

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.sessionData': {
			sessionID: string;
			session: ExpressSession;
		};
	}
}

export const expressSessionEvents = new TypedEventEmitter<{
	'session-init': [newSession: ExpressSession];
	'session-retrieve': [session: ExpressSession];
}>(new EventEmitter());

const sessionCollection = await getTypedMongoCollection('users', 'sessionData');
const SESSION_COOKIE = 'session';

async function allocateNewSession() {
	const sessionID = generateGUID();
	const sessionData = {
		sessionID,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		session: {} as any,
	};

	expressSessionEvents.dispatchEvent('session-init', sessionData.session);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await sessionCollection.insertOne(sessionData as any);

	return sessionData;
}

async function retrieveSession(sessionID: string) {
	const sessionData = await sessionCollection.findOne({
		sessionID,
	});
	if (!sessionData) {
		return null;
	}
	expressSessionEvents.dispatchEvent('session-retrieve', sessionData.session);
	return sessionData;
}

const loadedSessions: {
	[sessionID: string]: ExpressSession & SessionOptions;
} = {};

expressApp.use(async (req, res, next) => {
	let sessionID: string | undefined = req.cookies[SESSION_COOKIE];
	if (!sessionID) {
		const sessionData = await allocateNewSession();
		sessionID = sessionData.sessionID;
		// Set the cookie
		res.cookie(SESSION_COOKIE, sessionID);

		req.session = {
			...sessionData.session,
			save: async () => {
				await sessionCollection.updateOne(
					{
						sessionID,
					},
					{
						$set: {
							session: req.session,
						},
					},
				);
			},
		};
	} else {
		const sessionData = await retrieveSession(sessionID);
		if (!sessionData) {
			const newSessionData = await allocateNewSession();
			sessionID = newSessionData.sessionID;
			// Set the cookie
			res.cookie(SESSION_COOKIE, sessionID);

			req.session = {
				...newSessionData.session,
				save: async () => {
					await sessionCollection.updateOne(
						{
							sessionID,
						},
						{
							$set: {
								session: req.session,
							},
						},
					);
				},
			};
		} else {
			req.session = {
				...sessionData.session,
				save: async () => {
					await sessionCollection.updateOne(
						{
							sessionID,
						},
						{
							$set: {
								session: req.session,
							},
						},
					);
				},
			};
		}
	}
	next();
});

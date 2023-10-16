import { GenericNotification } from '../clientShared/Notification.js';
import { TypedWebSocket } from '../clientShared/TypedWebSocket.js';
import { PrivateUserProfile } from '../clientShared/UserInterface.js';
import { expressApp } from '../core/express.js';
import { logger } from '../core/logging.js';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';
import generateGUID from '../misc/Guid.js';
import delay from '../misc/delay.js';

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.auth': PrivateUserProfile & {
			password: string;
			sessionToken: string;
		};
	}
}

const userCollection = getTypedMongoCollection('users', 'auth');

expressApp.ws('/api/core/user', async (_ws, req) => {
	logger.info('New websocket');
	const ws = TypedWebSocket<{
		status: 'available' | 'unavailable';
		notification: GenericNotification;
	}>(_ws);
	await delay(500);
	ws.sendMessage('status', 'available');
});

expressApp.get('/api/core/user/authenticate', async (req, res) => {
	const user = (
		await userCollection
			.find({
				username: req.body.username,
			})
			.toArray()
	)[0];

	if (!user) {
		res.status(401).send('User not found');
		return;
	}

	if (user.password !== req.body.password) {
		res.status(401).send('Incorrect password');
		return;
	}

	user.sessionToken = generateGUID();

	await userCollection.updateOne(
		{ _id: user._id },
		{ $set: { sessionToken: user.sessionToken } },
	);

	res.cookie('session', user.sessionToken, {
		maxAge: 1000 * 60 * 60 * 24, // 1 day
	});

	res.standardFormat.success.json(user);
});

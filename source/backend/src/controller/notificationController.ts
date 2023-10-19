import { ObjectId } from 'mongodb';
import { GenericNotification } from '../clientShared/Notification.js';
import { expressApp } from '../core/express.js';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.notifications': {
			userId: ObjectId;
		} & GenericNotification;
	}
}

const notificationCollection = getTypedMongoCollection(
	'users',
	'notifications',
);

expressApp.get('/api/core/user/notifications', async (req, res) => {
	if (req.user === undefined) {
		res.standardFormat.error.json(new Error('Not logged in'));
		return;
	}

	const notifications = await notificationCollection
		.find({ userId: req.user._id })
		.toArray();

	res.standardFormat.success.json(notifications);
});

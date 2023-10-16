import { GenericNotification } from '../clientShared/Notification.js';
import { expressApp } from '../core/express.js';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.notifications': {
			userId: string;
		} & GenericNotification;
	}
}

const notificationCollection = getTypedMongoCollection(
	'users',
	'notifications',
);

expressApp.get('/api/core/user/notifications', async (req, res) => {});

import { ObjectId } from 'mongodb';
import { BasicUserProfile } from '../clientShared/UserInterface.js';
import { expressApp } from '../core/express.js';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';

declare module '../data/MongoConnectionManager.js' {
	interface MongoDatabaseSchema {
		'users.profile': BasicUserProfile & {
			userID: ObjectId;
		};
	}
}

const profileCollection = getTypedMongoCollection('users', 'profile');
const userCollection = getTypedMongoCollection('users', 'auth');

expressApp.get('/api/core/profile/currentUser', async (req, res) => {
	if (req.user === undefined) {
		res.standardFormat.error.json(new Error('Not logged in'));
		return;
	}
	const profile = await profileCollection.findOne({
		userID: req.user._id,
	});

	if (profile === null) {
		res.standardFormat.error.json(new Error('Profile not found'));
		return;
	}

	res.standardFormat.success.json(profile);
});

expressApp.get('/api/core/profile/orphaned', async (req, res) => {
	const result = [];
	for await (const profile of profileCollection.find({})) {
		const user = await userCollection.findOne({
			_id: profile.userID,
		});
		if (user === null) {
			profileCollection.deleteOne({ _id: profile._id });
			result.push(profile);
		}
	}
	res.standardFormat.success.json(result);
});

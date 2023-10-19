import { ObjectId, WithId } from 'mongodb';
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
		res.standardFormat.success.json(null);
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

expressApp.post('/api/core/profile/update', async (req, res) => {
	if (req.user === undefined) {
		res.standardFormat.error.json(new Error('Not logged in'));
		return;
	}

	const profile = await profileCollection.findOne({
		userID: req.user._id,
	});

	if (profile === null) {
		// We need to create a new profile
		const newProfile = req.body as BasicUserProfile & {
			userID: ObjectId;
		};
		newProfile.userID = req.user._id;
		await profileCollection.insertOne(
			newProfile as WithId<typeof newProfile>,
		);
		return;
	}

	const newProfile = req.body as BasicUserProfile;

	await profileCollection.updateOne(
		{ _id: profile._id },
		{ $set: newProfile },
	);

	res.standardFormat.success.json(newProfile);
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

function ensureProfileFor(userID: ObjectId) {
	return profileCollection.updateOne(
		{ userID },
		{ $setOnInsert: { userID } },
		{ upsert: true },
	);
}

expressApp.get('/api/core/profile/get', async (req, res) => {
	// Possible query parameters are: username, userID
	const query = req.query;

	if (query.username === undefined && query.userID === undefined) {
		res.standardFormat.error.json(new Error('Invalid query'));
		return;
	}

	let profile: BasicUserProfile | null = null;

	if (query.username) {
		const user = await userCollection.findOne({
			username: query.username,
		});
		if (user === null) {
			res.standardFormat.error.json(new Error('User not found'));
			return;
		}
		await ensureProfileFor(user._id);
		profile = await profileCollection.findOne({
			userID: user._id,
		});
	} else if (query.userID) {
		profile = await profileCollection.findOne({
			userID: new ObjectId(query.userID as string),
		});
	} else {
		res.standardFormat.error.json(
			new Error('Invalid query / Impossible code path'),
		);
		return;
	}

	if (profile === null) {
		res.standardFormat.error.json(new Error('Profile not found'));
		return;
	}

	res.standardFormat.success.json(profile);
});

import { expressApp } from '../core/express.js';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';
import generateGUID from '../misc/Guid.js';

const userCollection = getTypedMongoCollection('users', 'auth');
expressApp.get('/api/user/authenticate', async (req, res) => {
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

	res.status(200).send('OK').end();
});

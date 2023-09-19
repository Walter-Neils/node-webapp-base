import { expressApp } from '../core/express.js';
import { getMongoClient } from '../data/MongoConnectionManager.js';

const userDataDB = getMongoClient().db('UserData');

expressApp.get('/api/auth', async (req, res) => {
	res.end(
		JSON.stringify(await userDataDB.collection('test').find().toArray()),
	);
});

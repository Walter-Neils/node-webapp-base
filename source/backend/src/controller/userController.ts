import { expressApp } from '../core/express.js';
import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';

const userCollection = getTypedMongoCollection('users', 'auth');

(await userCollection.find({}).toArray())[0].password;

expressApp.get('/api/user', async (req, res) => {
	res.end(JSON.stringify(req.user ?? 'No user logged in'));
});

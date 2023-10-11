import { expressApp } from '../core/express.js';
// import { getTypedMongoCollection } from '../data/MongoConnectionManager.js';

// const userCollection = getTypedMongoCollection('auth', 'users');

expressApp.get('/api/user', async (req, res) => {
	res.end(JSON.stringify(req.user));
});

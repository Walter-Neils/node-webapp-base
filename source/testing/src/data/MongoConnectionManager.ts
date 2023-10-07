import * as mongo from 'mongodb';

const MONGO_URL =
	process.env['MONGO_URL'] ?? 'mongodb://admin:password@172.21.0.2:27017';

if (MONGO_URL === undefined) {
	throw new Error('MONGO_URL environment variable not set');
}

const client = new mongo.MongoClient(MONGO_URL);
await client.connect();

export function getMongoClient() {
	return client;
}

export type ServerSideDBOBject<T> = T & {
	_id: mongo.ObjectId;
};

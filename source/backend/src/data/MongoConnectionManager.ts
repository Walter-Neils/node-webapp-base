import * as mongo from 'mongodb';
import EventEmitter from 'node:events';
import TypedEventEmitter from '../misc/TypedEventListener.js';

const MONGO_URL =
	process.env['MONGO_URL'] ?? 'mongodb://admin:password@127.0.0.1:27017';

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

type WithFullDocument<T> = T & {
	fullDocument?: unknown;
	ns: {
		db: string;
		coll: string;
	};
};

const mongoConnectionEvents = new TypedEventEmitter<{
	drop: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	rename: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	dropDatabase: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	invalidate: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	createIndexes: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	create: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	modify: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	dropIndexes: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	shardCollection: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	reshardCollection: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	refineCollectionShardKey: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	insert: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	update: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	replace: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
	delete: [
		changeStreamDocument: WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>,
	];
}>(new EventEmitter());

const watchers: {
	[key: string]: {
		isCancelled: boolean;
		workerPromise: Promise<void>;
	};
} = {};

async function watcher() {
	for await (const change of client.watch(undefined, {
		fullDocument: 'updateLookup',
	})) {
		mongoConnectionEvents.dispatchEvent(
			change.operationType,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			change as any,
		);
	}
}

export function attachMongoDatabaseWatcher(db: string) {
	if (watchers[db] === undefined) {
		watchers[db] = {
			isCancelled: false,
			workerPromise: watcher(),
		};
	}
}

export function cancelMongoDatabaseWatcher(db: string) {
	if (watchers[db] !== undefined) {
		watchers[db].isCancelled = true;
	}
}

export function getMongoConnectionEventEmitter() {
	return mongoConnectionEvents;
}

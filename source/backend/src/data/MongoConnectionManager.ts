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

export interface MongoDatabaseSchema {}

type KeyValuePath<T> = T extends `${infer Key}.${infer Rest}`
	? {
			key: Key;
			value: Rest;
	  }
	: never;

type MongoDatabaseKeys = keyof {
	[key in keyof MongoDatabaseSchema as `${KeyValuePath<key>['key']}`]: KeyValuePath<key>['key'];
};

type MongoCollections<Database extends MongoDatabaseKeys> = {
	[key in keyof MongoDatabaseSchema as `${KeyValuePath<key>['value']}`]: key extends `${Database}.`
		? MongoDatabaseSchema[key]
		: never;
};

type CollectionStructure<
	Database extends MongoDatabaseKeys,
	Collection extends keyof MongoCollections<Database>,
> = MongoDatabaseSchema extends {
	[Key in `${Database}.${Collection}`]: infer Value;
}
	? Value
	: never;

export function getTypedMongoCollection<
	TDatabase extends MongoDatabaseKeys,
	TCollection extends keyof MongoCollections<TDatabase>,
>(database: TDatabase, collection: TCollection) {
	return client.db(database).collection<
		mongo.Document &
			CollectionStructure<TDatabase, TCollection> & {
				_id: mongo.ObjectId;
			}
	>(collection as string);
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
	for await (const _change of client.watch(undefined, {
		fullDocument: 'updateLookup',
	})) {
		const change = _change as WithFullDocument<
			mongo.ChangeStreamDocument<mongo.BSON.Document>
		>;
		if (watchers[change.ns.db]?.isCancelled) {
			break;
		}
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

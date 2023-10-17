import * as mongo from 'mongodb';
import EventEmitter from 'node:events';
import TypedEventEmitter from '../clientShared/TypedEventListener.js';

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

type DotPair<T extends string> = T extends `${infer Key}.${infer Rest}`
	? {
			first: Key;
			second: Rest;
	  }
	: never;

export type MongoDatabaseKeys = keyof {
	[key in keyof MongoDatabaseSchema as `${DotPair<key>['first']}`]: DotPair<key>['first'];
};

export type MongoCollections<Database extends MongoDatabaseKeys> = {
	[key in keyof MongoDatabaseSchema as key extends `${Database}.${infer Rest}`
		? `${Rest}`
		: // Next line must infer Rest to in order to not return never. Not sure why.
		  // eslint-disable-next-line @typescript-eslint/no-unused-vars
		  never]: key extends `${Database}.${infer Rest}`
		? MongoDatabaseSchema[key]
		: never;
};

export type CollectionStructure<
	Database extends MongoDatabaseKeys,
	Collection extends keyof MongoCollections<Database>,
> = MongoDatabaseSchema extends {
	[Key in `${Database}.${Collection}`]: infer Value;
}
	? Value
	: never;

/**
 * Gets a strongly typed collection from the database
 * @param database The name of the database
 * @param collection The name of the collection
 * @returns A strongly typed collection
 */
export function getTypedMongoCollection<
	TDatabase extends MongoDatabaseKeys,
	TCollection extends keyof MongoCollections<TDatabase>,
>(database: TDatabase, collection: TCollection) {
	return client
		.db(database)
		.collection<mongo.WithId<CollectionStructure<TDatabase, TCollection>>>(
			collection as string,
		);
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

/**
 * Attaches a watcher to a database
 * @param db The name of the database to watch
 */
export function attachMongoDatabaseWatcher(db: string) {
	if (watchers[db] === undefined) {
		watchers[db] = {
			isCancelled: false,
			workerPromise: watcher(),
		};
	}
}

/**
 * Cancels a watcher on a database. This will not stop the watcher immediately, but will stop it from continuing to watch the database.
 * @param db The name of the database to cancel the watcher on
 */
export function cancelMongoDatabaseWatcher(db: string) {
	if (watchers[db] !== undefined) {
		watchers[db].isCancelled = true;
	}
}

/**
 * Gets the event emitter for mongo connection events
 * @returns The event emitter for mongo connection events
 */
export function getMongoConnectionEventEmitter() {
	return mongoConnectionEvents;
}

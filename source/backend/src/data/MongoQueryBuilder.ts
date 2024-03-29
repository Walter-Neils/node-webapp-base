import { AggregationCursor, Collection, ObjectId } from 'mongodb';
import {
	MongoCollections,
	MongoDatabaseKeys,
} from './MongoConnectionManager.js';

type MongoComparisonOperator =
	| '$eq'
	| '$gt'
	| '$gte'
	| '$in'
	| '$lt'
	| '$lte'
	| '$ne'
	| '$nin';

type FundamentalType = string | number | boolean | Date;

type NonFundamentalFields<T> = {
	[K in keyof T as T[K] extends FundamentalType ? never : K]: T[K];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class MongoQueryBuilder<CollectionType> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private components: any[] = [];

	public excludeFields<TFields extends keyof CollectionType>(
		...fields: TFields[]
	) {
		this.components.push({
			$project: Object.fromEntries(fields.map(field => [field, 0])),
		});
		return this as unknown as MongoQueryBuilder<
			Omit<CollectionType, TFields>
		>;
	}

	public narrow<TFields extends keyof CollectionType>(...fields: TFields[]) {
		this.components.push({
			$project: Object.fromEntries(fields.map(field => [field, 1])),
		});
		return this as unknown as MongoQueryBuilder<
			Pick<CollectionType, TFields>
		>;
	}

	public where<
		TFields extends keyof CollectionType,
		TOperator extends MongoComparisonOperator,
		TValue extends CollectionType[TFields],
	>(field: TFields, operator: TOperator, value: TValue) {
		this.components.push({
			$match: {
				[field]: {
					[operator]: value,
				},
			},
		});

		// TODO: Narrow string literal type of field if operator is $eq
		return this as unknown as MongoQueryBuilder<CollectionType>;
	}

	public replaceRoot<
		TFields extends keyof NonFundamentalFields<CollectionType>,
	>(target: TFields) {
		this.components.push({
			$replaceRoot: {
				newRoot: target,
			},
		});

		return this as unknown as MongoQueryBuilder<CollectionType[TFields]>;
	}

	public lookup<
		TDatabase extends MongoDatabaseKeys,
		TCollection extends keyof MongoCollections<TDatabase>,
		TLocalCaptureAlias extends string,
		TLocalCaptures extends Partial<{
			// Map from local field to foreign field
			[K in keyof CollectionType]: TLocalCaptureAlias;
		}>,
		TPipeline extends MongoQueryBuilder<
			MongoCollections<TDatabase>[TCollection]
		>,
		TResultField extends string,
	>(
		database: TDatabase,
		collection: TCollection,
		captures: TLocalCaptures,
		pipelineBuilder: (
			builder: MongoQueryBuilder<
				{
					// TLocalCaptures maps a local field to a foreign lookup field
					// So we extend the builder's collection type with the foreign lookup field type info
					[K in keyof TLocalCaptures as TLocalCaptures[K] extends TLocalCaptureAlias
						? TLocalCaptures[K]
						: 'x_key_fail']: CollectionType extends {
						[X in K]: infer TCollectionStructure;
					}
						? TCollectionStructure
						: unknown;
				} & (MongoCollection<TDatabase, TCollection> extends never
					? 'collection_resolution_fail'
					: MongoCollection<TDatabase, TCollection>)
			>,
		) => TPipeline,
		resultField: TResultField,
	) {
		const pipeline = pipelineBuilder(
			getMongoQueryBuilder(database, collection),
		);

		this.components.push({
			$lookup: {
				from: collection,
				let: captures,
				pipeline: pipeline.components,
				as: resultField,
			},
		});

		return this as unknown as MongoQueryBuilder<
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			CollectionType & {
				[K in TResultField]: TPipeline extends MongoQueryBuilder<
					infer T
				>
					? T[]
					: never;
			}
		>;
	}

	public getArrayItem<
		TKey extends keyof CollectionType,
		TIndex extends number,
		TResultKey extends string,
	>(key: TKey, index: TIndex, destination: TResultKey) {
		this.components.push({
			$project: {
				[destination]: {
					$arrayElemAt: [key, index],
				},
			},
		});

		return this as unknown as MongoQueryBuilder<
			Omit<CollectionType, TResultKey> & {
				[K in TResultKey]: CollectionType[TKey] extends unknown[]
					? CollectionType[TKey][TIndex]
					: never;
			}
		>;
	}

	public test(): CollectionType[] {
		return [];
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public applyAggregate(collection: Collection<any>) {
		return collection.aggregate(
			this.components,
		) as AggregationCursor<CollectionType>;
	}

	public async applyFindOne(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		collection: Collection<any>,
	): Promise<CollectionType | undefined> {
		if (this.components.length === 0) {
			throw new Error('No components in query');
		} else if (this.components.length === 1) {
			return collection.findOne(this.components[0]);
		}

		const results = await this.applyAggregate(collection).toArray();
		return results[0];
	}

	public get _rawComponents() {
		return this.components;
	}
}

type MongoCollection<
	TDatabase extends MongoDatabaseKeys,
	TCollection extends keyof MongoCollections<TDatabase>,
> = MongoCollections<TDatabase>[TCollection] extends Record<string, unknown>
	? MongoCollections<TDatabase>[TCollection]
	: never;

export function getMongoQueryBuilder<
	TDatabase extends MongoDatabaseKeys,
	TCollection extends keyof MongoCollections<TDatabase>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(database: TDatabase, collection: TCollection) {
	return new MongoQueryBuilder<
		MongoCollections<TDatabase>[TCollection] & {
			_id: ObjectId;
		}
	>();
}

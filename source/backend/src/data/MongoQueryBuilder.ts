import { AggregationCursor, Collection, WithId } from 'mongodb';
import { GenericNotification } from '../clientShared/Notification.js';

type ComparisonOperator =
	| '$eq'
	| '$gt'
	| '$gte'
	| '$in'
	| '$lt'
	| '$lte'
	| '$ne'
	| '$nin';

type AdditionalCaptureValueModes = '$first' | '$last';

type OnlyArrays<T> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in keyof T as T[K] extends any[] ? K : never]: T[K];
};

type Prefix<T, P extends string> = {
	[K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};

type StringOrFieldAccess<
	Value extends string,
	Keys extends string,
> = Value extends `$${infer Key}` ? Keys : string;

export default class MongoQueryBuilder<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	CollectionType extends Record<string, any>,
	AdditionalCollections extends {
		[key: string]: Record<string, unknown>;
	} = Record<string, Record<string, unknown>>,
> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _components: any[] = [];

	public where<K extends keyof CollectionType>(
		key: K,
		operator: ComparisonOperator,
		value: string,
	): this {
		this._components.push({
			$match: {
				[key]: {
					[operator]: value,
				},
			},
		});
		return this;
	}

	public excludeField<K extends keyof CollectionType>(key: K) {
		this._components.push({
			$unset: key,
		});
		return this as MongoQueryBuilder<Omit<CollectionType, K>>;
	}

	public limit(limit: number) {
		this._components.push({
			$limit: limit,
		});
		return this;
	}

	public sort<K extends keyof CollectionType>(key: K, direction: 1 | -1) {
		this._components.push({
			$sort: {
				[key]: direction,
			},
		});
		return this;
	}

	public uniqueValues<K extends keyof CollectionType & string>(key: K) {
		this._components.push({
			$group: {
				_id: `$${key}`,
			},
		});
		return this as unknown as MongoQueryBuilder<{
			_id: CollectionType[K];
		}>;
	}

	public replaceRoot<K extends keyof CollectionType & string>(key: K) {
		this._components.push({
			$replaceRoot: {
				newRoot: `$${key}`,
			},
		});
		return this as unknown as MongoQueryBuilder<CollectionType[K]>;
	}

	public lookup<
		KFrom extends keyof AdditionalCollections & string,
		KAvailablePipelineVariables extends keyof CollectionType & string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		KPipeline extends MongoQueryBuilder<any>,
		KAs extends string,
	>(
		from: KFrom,
		capture: KAvailablePipelineVariables[],
		pipelineBuilder: (
			builder: MongoQueryBuilder<
				AdditionalCollections[KFrom] & {
					[K in KAvailablePipelineVariables as `capture_${K}`]: CollectionType[K];
				}
			>,
		) => KPipeline,
		as: KAs,
	) {
		const pipeline = pipelineBuilder(new MongoQueryBuilder())._components;
		this._components.push({
			$lookup: {
				from,
				let: capture.reduce(
					(acc, cur) => ({ ...acc, [`capture_${cur}`]: `$${cur}` }),
					{} as Record<string, string>,
				),
				pipeline,
				as,
			},
		});
		return this as unknown as MongoQueryBuilder<
			CollectionType & {
				[K in KAs]: KPipeline extends MongoQueryBuilder<infer T>
					? T[]
					: never;
			}
		>;
	}

	public extractArrayElement<
		KTargetArray extends keyof OnlyArrays<CollectionType> & string,
		KResultName extends string,
	>(targetArray: KTargetArray, index: number, resultName: KResultName) {
		this._components.push({
			$addFields: {
				[resultName]: {
					$arrayElemAt: [`$${targetArray}`, index],
				},
			},
		});
		return this as unknown as MongoQueryBuilder<
			Omit<CollectionType, KResultName> & {
				[K in KResultName]: CollectionType[KTargetArray][number];
			}
		>;
	}

	public applyAggregate<MongoCollectionType extends Collection<WithId<any>>>(
		collection: MongoCollectionType,
	): AggregationCursor<CollectionType> {
		return collection.aggregate(this._components);
	}
}

const test = new MongoQueryBuilder<
	GenericNotification & {
		associatedUser: string;
	},
	{
		users: {
			userID: string;
		};
	}
>()
	.lookup(
		'users',
		['associatedUser'],
		builder => {
			return builder.where('capture_associatedUser', '$eq', '');
		},
		'user',
	)
	.extractArrayElement('user', 0, 'user');

for await (const item of test.applyAggregate(null!)) {
}

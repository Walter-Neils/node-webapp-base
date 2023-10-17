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

class MongoQueryBuilder<CollectionType extends Record<string, unknown>> {
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
}

export function getMongoQueryBuilder<
	TDatabase extends MongoDatabaseKeys,
	TCollection extends keyof MongoCollections<TDatabase>,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(database: TDatabase, collection: TCollection) {
	return new MongoQueryBuilder<MongoCollections<TDatabase>[TCollection]>();
}

getMongoQueryBuilder('users', 'notifications')
	.where('severity', '$eq', 'info')
	.where('userId', '$eq', '123');

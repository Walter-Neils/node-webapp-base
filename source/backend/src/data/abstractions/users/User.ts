import { ObjectId } from 'mongodb';
import { getTypedMongoCollection } from '../../MongoConnectionManager.js';
import { getMongoQueryBuilder } from '../../MongoQueryBuilder.js';
const authCollection = getTypedMongoCollection('users', 'auth');
export default class User {
	private authCollectionId: ObjectId;
	private constructor(authCollectionId: ObjectId) {
		this.authCollectionId = authCollectionId;
	}

	public static async getUserByUsername(username: string): Promise<User> {
		const queryBuilder = getMongoQueryBuilder('users', 'auth')
			.where('username', '$eq', username)
			.narrow('_id');

		const result = await queryBuilder.applyFindOne(authCollection);

		if (!result) {
			throw new Error('User not found');
		}

		return new User(result._id);
	}

	public async getUsername(): Promise<string> {
		const queryBuilder = getMongoQueryBuilder('users', 'auth')
			.where('_id', '$eq', this.authCollectionId)
			.narrow('username');

		const result = await queryBuilder.applyFindOne(authCollection);

		if (!result) {
			throw new Error('User not found');
		}

		return result.username;
	}
}

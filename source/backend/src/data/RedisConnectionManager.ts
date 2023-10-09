import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClients: {
	[key: number]: ReturnType<typeof createClient>;
} = {};

export async function getRedisClient(db?: number) {
	db = db || 0;
	if (!redisClients[db]) {
		const client = createClient({
			url: REDIS_URL,
			database: db,
		});
		await client.connect();
		redisClients[db] = client;
	}

	return redisClients[db];
}

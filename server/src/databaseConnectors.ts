import * as mongo from 'mongodb';

const mongoConnectionString = 'mongodb://localhost:27017';
const mongoClient = new mongo.MongoClient(mongoConnectionString);
await mongoClient.connect();
export const serverDatabase = mongoClient.db('Server');

export function getDatabase(name: string)
{
    return mongoClient.db(name);
}
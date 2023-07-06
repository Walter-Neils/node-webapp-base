import * as mongo from 'mongodb';

const mongoUser = 'vineyard';
const mongoPassword = 'R0b0tslab';
const baseURL = 'localhost';

const mongoClientInstances = new Map<string, mongo.MongoClient>();

const mongoConnectionString = `mongodb+srv://${mongoUser}:${mongoPassword}@${baseURL}/test?retryWrites=true&w=majority`;
const mongoClient = new mongo.MongoClient(mongoConnectionString);
await mongoClient.connect();
mongoClientInstances.set('Core', mongoClient);
export const serverDatabase = await getMongoDatabase('Server');

export type CommonClientIdentifier = 'Core';
export type CommonDBIdentifier = 'Server' | 'ExampleTimeSeriesData';

export async function getMongoDatabase<T extends CommonDBIdentifier = CommonDBIdentifier>(name: T): Promise<mongo.Db>
{
    const db = mongoClient.db(name, {});
    return db;
}

export async function getMongoClient<T extends CommonClientIdentifier = CommonClientIdentifier>(name: T): Promise<mongo.MongoClient>
{
    const client = mongoClientInstances.get(name);
    if (!client)
        throw new Error(`Mongo client ${name} not found.`);
    return client;
}

export function registerMongoClient<T extends CommonClientIdentifier = CommonClientIdentifier>(name: T, client: mongo.MongoClient)
{
    mongoClientInstances.set(name, client);
}
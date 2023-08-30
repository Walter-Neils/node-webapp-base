import * as mongo from 'mongodb';

const MONGO_URL = process.env[ "MONGO_URL" ];
if (MONGO_URL === undefined)
{
    throw new Error("MONGO_URL is not defined");
}

const client = new mongo.MongoClient(MONGO_URL);
await client.connect();

export function getMongoClient()
{
    return client;
}
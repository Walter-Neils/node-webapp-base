import { expressApp } from "../core/express.js";
import { getMongoClient } from "../data/MongoConnectionManager.js";

expressApp.get('/test', async (req, res) =>
{
    throw new Error("Test error");
});
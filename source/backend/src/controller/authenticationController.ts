import { getMongoClient } from "../data/MongoConnectionManager.js";

const userDataDB = getMongoClient().db("UserData");
import { MongoClient } from "mongodb";
import { expressApp } from "./core/express.js";
import { logger } from "./core/logging.js";
import fs from "fs";


if (process.env[ "NODE_ENV" ] === undefined)
{
    // Change working directory to ./build
    process.chdir("./build");
}

logger.info(`Starting server in ${process.cwd()}`);
logger.info(`Mode: ${process.env[ "NODE_ENV" ]}`);

// Load all middlewares and controllers

const MIDDLEWARES_PATH = "./middleware";
const CONTROLLERS_PATH = "./controller";

const middlewareFiles = fs.readdirSync(MIDDLEWARES_PATH).filter(file => file.endsWith(".js"));
const controllerFiles = fs.readdirSync(CONTROLLERS_PATH).filter(file => file.endsWith(".js"));

for (const file of middlewareFiles)
{
    await import(`${MIDDLEWARES_PATH}/${file}`);
}

for (const file of controllerFiles)
{
    await import(`${CONTROLLERS_PATH}/${file}`);
}

expressApp.listen(5000);
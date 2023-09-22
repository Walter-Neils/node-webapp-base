import { expressApp } from './core/express.js';
import { logger } from './core/logging.js';
import fs from 'fs';

if (process.env[ 'NODE_ENV' ] === undefined)
{
	// Change working directory to ./build
	process.chdir('./build');
}

logger.info(`Starting server in ${process.cwd()}`);
logger.info(`Mode: ${process.env[ 'NODE_ENV' ]}`);

// Load all middlewares and controllers

const MIDDLEWARES_PATH = './middleware';
const CONTROLLERS_PATH = './controller';

await Promise.all(
	fs
		.readdirSync(MIDDLEWARES_PATH)
		.filter(file => file.endsWith('.js'))
		.map(async file =>
		{
			logger.info(`Loading middleware: ${file}`);
			await import(`${MIDDLEWARES_PATH}/${file}`);
		}),
);

await Promise.all(
	fs
		.readdirSync(CONTROLLERS_PATH)
		.filter(file => file.endsWith('.js'))
		.map(async file =>
		{
			logger.info(`Loading controller: ${file}`);
			await import(`${CONTROLLERS_PATH}/${file}`);
		}),
);



expressApp.listen(5000);

import { configurationManager } from './core/configuration/ConfigurationManager.js';
import { expressApp } from './core/express.js';
import { logger } from './core/logging.js';
import fs from 'fs';

declare module './core/configuration/ConfigurationManager.js' {
	interface Configuration {
		'middleware-load-configuration': {
			path: string;
			priority: number;
		}[];
		'controller-load-configuration': {
			path: string;
			priority: number;
		}[];
	}
}

if (process.env['NODE_ENV'] === undefined) {
	// Change working directory to ./build
	process.chdir('./build');
}

logger.info(`Starting server in ${process.cwd()}`);
logger.info(`Mode: ${process.env['NODE_ENV']}`);

// Load all middlewares and controllers

const MIDDLEWARES_PATH = './middleware';
const CONTROLLERS_PATH = './controller';

logger.info('Loading middlewares...');

let middlewareConfiguration = await configurationManager.getConfigurationValue(
	'middleware-load-configuration',
);

if (middlewareConfiguration === undefined) {
	const generated = fs
		.readdirSync(MIDDLEWARES_PATH)
		.filter(file => file.endsWith('.js'))
		.map(file => ({
			path: `${file}`,
			priority: 0,
		}));

	await configurationManager.setConfigurationValue(
		'middleware-load-configuration',
		generated,
	);
	middlewareConfiguration = generated;
	logger.warn(
		'Middleware configuration not found, generating default configuration',
	);
}

// Larger priority = executed first
middlewareConfiguration.sort((a, b) => a.priority - b.priority);

await Promise.all(
	middlewareConfiguration.map(async middleware => {
		await import(`${MIDDLEWARES_PATH}/${middleware.path}`);
	}),
);

logger.info('Loading controllers...');

let controllerConfiguration = await configurationManager.getConfigurationValue(
	'controller-load-configuration',
);

if (controllerConfiguration === undefined) {
	const generated = fs
		.readdirSync(CONTROLLERS_PATH)
		.filter(file => file.endsWith('.js'))
		.map(file => ({
			path: `${file}`,
			priority: 0,
		}));

	await configurationManager.setConfigurationValue(
		'controller-load-configuration',
		generated,
	);
	controllerConfiguration = generated;
	logger.warn(
		'Controller configuration not found, generating default configuration',
	);
}

controllerConfiguration.sort((a, b) => a.priority - b.priority);

await Promise.all(
	controllerConfiguration.map(async controller => {
		await import(`${CONTROLLERS_PATH}/${controller.path}`);
	}),
);

logger.info('Starting server...');

expressApp.listen(5000);

logger.info(`Server started on port 5000`);

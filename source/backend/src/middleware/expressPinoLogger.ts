import { expressApp } from '../core/express.js';
import { logger } from '../core/logging.js';

expressApp.use(async (req, res, next) => {
	type Level = 'info' | 'warn' | 'error';
	const log = (
		level: Level,
		message: string,
		obj?: {
			requestInfo?: object;
		},
	) => {
		logger[level](
			{
				...obj,
				requestInfo: {
					method: req.method,
					url: req.url,
					ip: req.ip,
					...obj?.requestInfo,
				},
			},
			message,
		);
	};
	req.logger = {
		info: (message: string, obj?: object) => log('info', message, obj),
		warn: (message: string, obj?: object) => log('warn', message, obj),
		error: (message: string, obj?: object) => log('error', message, obj),
	};
	next();
});

type LoggerFunction = (message: string, obj?: object) => void;

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			logger: {
				info: LoggerFunction;
				warn: LoggerFunction;
				error: LoggerFunction;
			};
		}
	}
}

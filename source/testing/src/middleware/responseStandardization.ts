import { expressApp } from '../core/express.js';

expressApp.use((_req, res, next) => {
	res.standardFormat = {
		success: {
			json: data => {
				res.statusCode = 200;
				res.json({
					success: true,
					content: data,
				});
				res.end();
			},
			text: data => {
				res.statusCode = 200;
				// Set MIME type to text/plain
				res.setHeader('Content-Type', 'text/plain');
				res.send(data);
				res.end();
			},
		},
		error: {
			json: (error, extraData, statusCode) => {
				res.statusCode = statusCode ?? 500;
				const errorObject: {
					message: string;
					stack?: string;
					extraData?: unknown;
				} = {
					message: error.message,
				};

				if (process.env.NODE_ENV === 'development') {
					errorObject.stack = error.stack;
				}

				if (extraData !== undefined) {
					errorObject.extraData = extraData;
				}

				res.json({
					success: false,
					error: errorObject,
				});

				res.end();
			},
		},
	};

	next();
});

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Response {
			standardFormat: {
				/**
				 * Send a successful response. This will set the status code to 200, and close the response.
				 */
				success: {
					json: (data: unknown) => void;
					text: (data: string) => void;
				};

				error: {
					json: (
						error: Error,
						additionalData?: unknown,
						statusCode?: number,
					) => void;
				};
			};
		}
	}
}

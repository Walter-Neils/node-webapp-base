import cookieParser from 'cookie-parser';
import express from 'express';

export const expressApp = express();

expressApp.use(cookieParser());

const errorRequestHandler: express.ErrorRequestHandler = (err, req, res, next) =>
{
	res.statusCode = 500;

	res.standardFormat.error.json(err);

	next(err);
};

setTimeout(() =>
{
	expressApp.use(errorRequestHandler);
}, 2500);

const overriddenExpressFunctions = {
	get: expressApp.get,
	post: expressApp.post,
};

const overriddenExpressFunctionsNames: (keyof typeof overriddenExpressFunctions)[] =
	Object.keys(
		overriddenExpressFunctions,
	) as (keyof typeof overriddenExpressFunctions)[];

for (const functionName of overriddenExpressFunctionsNames)
{
	// Replace the handler with a wrapper that catches errors in the handler and passes them to next()
	const originalHandler = overriddenExpressFunctions[ functionName ];
	// @ts-ignore
	overriddenExpressFunctions[ functionName ] = (
		path: string,
		...handlers: express.RequestHandler[]
	) =>
	{
		// @ts-ignore
		originalHandler.call(
			expressApp,
			path,
			// @ts-ignore: We're doing some really weird stuff here and it's not worth the effort to make TS happy
			...handlers.map(
				// @ts-ignore
				handler => (req, res, next) =>
				{
					try
					{
						const handlerResult: unknown = handler(req, res, next);
						if (handlerResult instanceof Promise)
						{
							handlerResult.catch(next);
						} else if (handlerResult instanceof Error)
						{
							next(handlerResult);
						} else if (handlerResult === undefined)
						{
							next();
						}
					} catch (err)
					{
						next(err);
					}
				},
			),
		);
	};

	// @ts-ignore
	expressApp[ functionName ] = overriddenExpressFunctions[ functionName ];
}

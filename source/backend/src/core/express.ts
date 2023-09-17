import cookieParser from "cookie-parser";
import express from "express";
import { nextTick } from "process";

export const expressApp = express();

expressApp.use(cookieParser());

const errorRequestHandler: express.ErrorRequestHandler = (err, req, res, next) =>
{
    const response = {
        success: false,
        error: err.message,
    };

    res.statusCode = 500;

    res.end(JSON.stringify(response));
};

setTimeout(() =>
{
    expressApp.use(errorRequestHandler);
}, 2500);


const overriddenExpressFunctions = {
    get: expressApp.get,
    post: expressApp.post,
};

const overriddenExpressFunctionsNames: (keyof typeof overriddenExpressFunctions)[] = Object.keys(overriddenExpressFunctions) as any;

for (const functionName of overriddenExpressFunctionsNames)
{
    // Replace the handler with a wrapper that catches errors in the handler and passes them to next()
    const originalHandler = overriddenExpressFunctions[ functionName ];
    // @ts-ignore
    overriddenExpressFunctions[ functionName ] = (path: string, ...handlers: express.RequestHandler[]) =>
    {
        // @ts-ignore
        originalHandler.call(expressApp, path, ...handlers.map(
            // @ts-ignore
            handler => (req, res, next) =>
            {
                try
                {
                    const handlerResult: unknown = handler(req, res, next);
                    if (handlerResult instanceof Promise)
                    {
                        handlerResult.catch(next);
                    }
                    else if (handlerResult instanceof Error)
                    {
                        next(handlerResult);
                    }
                    else if (handlerResult === undefined)
                    {
                        next();
                    }
                }
                catch (err)
                {
                    next(err);
                }
            }));
    };

    // @ts-ignore
    expressApp[ functionName ] = overriddenExpressFunctions[ functionName ];
}
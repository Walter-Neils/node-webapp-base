import { expressApp } from "../core/express.js";

expressApp.use((_req, res, next) =>
{
    res.standardFormat = {
        success: {
            json: (data) =>
            {
                res.statusCode = 200;
                res.json({
                    success: true,
                    content: data
                });
                res.end();
            }
        },
        error: {
            json: (error, statusCode) =>
            {
                res.statusCode = statusCode ?? 500;
                const errorObject = {
                    message: error.message,
                };

                if (process.env.NODE_ENV === 'development')
                {
                    (errorObject as unknown as {
                        stack: string | undefined;
                    }).stack = error.stack;
                }

                res.json({
                    success: false,
                    error: errorObject
                });

                res.end();
            }
        }
    };

    next();
});

declare global
{
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express
    {
        interface Response
        {
            standardFormat: {
                success: {
                    json: (data: unknown) => void;
                };

                error: {
                    json: (error: Error, statusCode?: number) => void;
                };
            };
        }
    }
}
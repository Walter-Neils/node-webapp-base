// HTTP server
import { createServer, IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import { ServerPersistentStorage } from './serverPersistentStorage.ts';

const log = ServerPersistentStorage.useLogger("Server Core");


const port = await ServerPersistentStorage.getConfigurationValue<number[]>("server-ports", [ 5000 ]);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface IHandler
{
    pathRegex: RegExp;
    handler: (req: IncomingMessage, res: ServerResponse) => Promise<any>;
    priority: number;
    method: string | string[] | undefined;
}

/**
 * When thrown from a handler, the server will continue to look for another handler to handle the request as if the handler did not exist.
 */
export class HTTPRequestFallthroughError
{
    public message: string;
    constructor(message: string)
    {
        this.message = message;
    }
}

/**
 * When thrown from a handler, the server will redirect the request to the specified URL.
 */
export class HTTPInternalRedirect
{
    public toURL: string;
    constructor(toURL: string)
    {
        this.toURL = toURL;
    }
}

const handlers: IHandler[] = [];

// Decorator 'route' adds a handler to the handlers array
export function route(config: {
    pathRegex: RegExp, methods?: string | string[], priority?: number;
})
{
    const { pathRegex, methods, priority = 0 } = config;
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor)
    {
        const targetName = target.constructor.name;
        const newHandler: IHandler = {
            pathRegex,
            handler: (x, y) =>
            {
                const instance = new target.constructor();
                return instance[ propertyKey ](x, y);
            },
            priority,
            method: methods
        };
        let newHandlers = [ ...handlers, newHandler ];
        newHandlers.sort((a, b) => b.priority - a.priority);
        handlers.splice(0, handlers.length, ...newHandlers);
    };
}

const ddosMap: Map<string, number> = new Map();
const ddosThreshold = await ServerPersistentStorage.getConfigurationValue<number>("server-ddos-threshold", 250);
const ddosReductionInterval = await ServerPersistentStorage.getConfigurationValue<number>("server-ddos-reduction-interval", 250);
const ddosReductionAmount = await ServerPersistentStorage.getConfigurationValue<number>("server-ddos-reduction-amount", 1);

setInterval(() =>
{
    // Reduce the number of requests per IP by 1
    for (const [ ip, count ] of ddosMap.entries())
    {
        if (count > 0)
        {
            ddosMap.set(ip, Math.max(0, count - ddosReductionAmount));
        }
    }
}, ddosReductionInterval);

for (const portNum of port)
{
    const server = createServer(async (req, res) =>
    {
        const context: any = {
            rawUrl: req.url ?? 'UNKNOWN',
        };

        const sourceIP = req.socket.remoteAddress ?? 'UNKNOWN';
        if (sourceIP === 'UNKNOWN')
        {
            res.statusCode = 400;
            res.end();
        }
        if (!ddosMap.has(sourceIP))
        {
            ddosMap.set(sourceIP, 0);
        }
        if (ddosMap.get(sourceIP)! > ddosThreshold) 
        {
            res.statusCode = 429;
            res.end(`Too many requests`);
            return;
        }
        ddosMap.set(sourceIP, ddosMap.get(sourceIP)! + 1);

        const maximumRequestTime = await ServerPersistentStorage.getConfigurationValue<number>("server-maximum-request-time", 60000);

        const failureTimeout = setTimeout(() =>
        {
            res.end(`Request timed out after ${maximumRequestTime}ms`);
        }, maximumRequestTime);

        const addTimingContext = (name: string, value: any) => context[ name ] = value;

        const action = async () =>
        {
            // Allow CORS
            res.setHeader('Access-Control-Allow-Origin', '*');

            if (!req.url)
            {
                res.statusCode = 400;
                res.end();
                return;
            }

            while (true)
            {
                let suspend404 = false;
                for (const handler of handlers)
                {
                    if (!handler.pathRegex.test(req.url))
                    {
                        continue;
                    }
                    if (handler.method instanceof Array)
                    {
                        if (handler.method.indexOf(req.method ?? 'UNKNOWN') === -1)
                        {
                            continue;
                        }
                    }
                    else if (handler.method !== undefined)
                    {
                        if (handler.method !== req.method)
                        {
                            continue;
                        }
                    }

                    if (handler)
                    {
                        try
                        {
                            const handlerResult = await handler.handler(req, res);
                            if (handlerResult !== undefined && !res.writableEnded)
                            {
                                // If it's a string just send it
                                if (typeof handlerResult === 'string')
                                {
                                    res.end(handlerResult);
                                }
                                // If it's a buffer send it
                                else if (handlerResult instanceof Buffer)
                                {
                                    res.end(handlerResult);
                                }
                                // If it's a stream pipe it
                                if (handlerResult instanceof fs.ReadStream)
                                {
                                    handlerResult.pipe(res);
                                    handlerResult.close();
                                }
                                // If it's a standard JSON object stringify it
                                else if (typeof handlerResult === 'object')
                                {
                                    res.end(JSON.stringify(handlerResult, undefined, 4));
                                }
                                // If it's a response object send it
                                else if (handlerResult instanceof Response)
                                {
                                    res.end(handlerResult.body);
                                }
                                else if (handlerResult instanceof Boolean)
                                {
                                    res.end(handlerResult.toString());
                                }
                                else if (handlerResult instanceof String)
                                {
                                    res.end(handlerResult);
                                }
                                else
                                {
                                    console.warn(`[${req.method}] ${req.url} => unknown result type ${typeof handlerResult}`);
                                }
                            }
                            if (res.writableEnded)
                            {
                                return;
                            }
                            else
                            {
                                console.warn(`[${req.method}] ${req.url} => handler did not finalize response`);
                            }
                        }
                        catch (e: any)
                        {
                            if (e instanceof HTTPRequestFallthroughError)
                            {
                                console.log(`Fallthrough for path ${req.url}`);
                                continue;
                            }
                            else if (e instanceof HTTPInternalRedirect)
                            {
                                console.log(`Redirecting ${req.url} to ${e.toURL}`);
                                req.url = e.toURL;
                                suspend404 = true;
                                break;
                            }

                            console.error(e);
                            res.statusCode = 500;
                            res.end();
                            return;
                        }
                    }
                }

                if (!suspend404)
                {
                    console.error(`[${req.method}] ${req.url} => 404`);
                    res.statusCode = 404;
                    res.end();
                    return;
                }
            }


        };
        const collectingTimeInformationForAllRequests = await ServerPersistentStorage.getConfigurationValue<boolean>("server-collect-all-timings", false);
        if (collectingTimeInformationForAllRequests)
        {
            ServerPersistentStorage.timeOperation('RESTRequest', action, context);
        }
        else
        {
            await action();
        }
        clearTimeout(failureTimeout);
    });
    server.listen(portNum, () =>
    {
        log('info', `Server listening on port ${portNum}`);
    });
}


class APIStatus
{
    @route({ pathRegex: /\/api\/status\/available/ })
    public async health(req: IncomingMessage, res: ServerResponse)
    {
        res.end('true');
    }
    // API Failures
    @route({ pathRegex: /\/api\/failures/ })
    public async failures(req: IncomingMessage, res: ServerResponse)
    {
        res.end('[]');
    }

    // Path /status/version
    @route({ pathRegex: /\/api\/status\/version/ })
    public async version(req: IncomingMessage, res: ServerResponse)
    {
        res.end('1.0.0');
    }
}



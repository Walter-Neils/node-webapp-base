// HTTP server
import { createServer as createHttpsServer } from 'https';
import { RequestListener, createServer as createHttpServer } from 'http';
import fs from 'fs';
import { ServerPersistentStorage } from '../database/serverPersistentStorage.js';
import { AsArray } from '../../shared/AsArray.js';
import { ServerOptions } from 'https';
import { IncomingMessage, ServerResponse } from 'http';
import { PathHandler } from './pathHandler.js';
import { Controller, ControllerArgs, ControllerContextOffset, UseControllerContext } from './controller.js';
import { ControllerContextProvider } from './controllerContextProvider.js';
import { HTTPRequestFallthrough, HTTPInternalRedirect } from './requestPathOperators.js';
import { IRawPathRestrictor, IRefinedPathRestrictor } from './pathRestrictorStructures.js';

const log = await ServerPersistentStorage.useLogger("Server Core");


const port = await ServerPersistentStorage.getConfigurationValue<number[]>("server-ports", [ 5000 ]);


let pathRestrictors: IRefinedPathRestrictor[] = [];

async function UpdatePathRestrictors()
{
    const unrefined = await ServerPersistentStorage.getConfigurationValue<IRawPathRestrictor[]>('endpoint-restrictions', [
        {
            rawPattern: 'DUMMY_PATH',
            enabled: false,
            message: 'Path has been disabled'
        }
    ]);
    const result: IRefinedPathRestrictor[] = [];
    for (const item of unrefined)
    {
        result.push({
            pattern: new RegExp(item.rawPattern),
            enabled: item.enabled,
            message: item.message
        });
    }
    pathRestrictors = result;
}

UpdatePathRestrictors();

setInterval(UpdatePathRestrictors, await ServerPersistentStorage.getConfigurationValue<number>('path-restriction-update-delay', 60000));

const handlers: PathHandler[] = [];
const contextProviders: ControllerContextProvider[] = [];

// Decorator 'route' adds a handler to the handlers array
export function route(config: {
    pathRegex: RegExp, methods?: string | string[], priority?: number;
})
{
    const { pathRegex, methods, priority = 0 } = config;
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor)
    {
        const newHandler: PathHandler = {
            pathRegex,
            handler: async (x, y, controllerArgs: ControllerArgs) =>
            {
                const instance = new target.constructor(controllerArgs);
                if ((instance as Controller).isControllerContextAvailable)
                {
                    const controllerInstance = instance as Controller;
                    const setControllerContextValue = UseControllerContext<string>(controllerInstance)[ ControllerContextOffset.SetContextValue ];
                    for (const contextProvider of contextProviders)
                    {
                        try
                        {
                            await contextProvider.provider(x, y, controllerInstance);
                        }
                        catch (e: any)
                        {
                            console.error(`[RequestContext] Provider '${contextProvider.name}' threw an unhandled exception`);
                        }
                    }
                    setControllerContextValue('test', true);
                }
                else
                {
                    // console.log(`[${config.pathRegex}] Controller context unavailable`);
                }
                const handler = instance[ propertyKey ].bind(instance);

                return await handler(x, y);
            },
            priority,
            method: methods
        };
        let newHandlers = [ ...handlers, newHandler ];
        newHandlers.sort((a, b) => b.priority - a.priority);
        handlers.splice(0, handlers.length, ...newHandlers);
    };
}

export function contextProvider(config: { name: string; })
{
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor)
    {
        const targetName = target.constructor.name;
        const newHandler: ControllerContextProvider = {
            name: `${targetName}.${config.name}`,
            provider: async (req, res, contextOutputTarget) =>
            {
                const instance = new target.constructor();
                await instance[ propertyKey ](req, res, contextOutputTarget);
            }
        };
        let newContextProviders = [ ...contextProviders, newHandler ];
        contextProviders.splice(0, contextProviders.length, ...newContextProviders);
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

const serverStartupHandlers: (() => void)[] = [];
let isAlreadyStarted = false;

const options = {
    key: await ServerPersistentStorage.getConfigurationValue<string | undefined>('server-ssl-key', undefined),
    cert: await ServerPersistentStorage.getConfigurationValue<string | undefined>('server-ssl-cert', undefined),
};



if (options.key === undefined || options.cert === undefined)
{
    await log('warn', 'SSL key or certificate is not configured. The server will run in HTTP mode.');
}

// If 'disable-ssl' is set to true, disable SSL
if (await ServerPersistentStorage.getConfigurationValue<boolean>('disable-ssl', false))
{
    options.key = undefined;
    options.cert = undefined;
    await log('warn', 'SSL has been disabled by configuration');
}

const createServer = (requestListener: RequestListener<typeof IncomingMessage, typeof ServerResponse>) =>
{
    if (options.key === undefined || options.cert === undefined)
    {
        return createHttpServer(requestListener);
    }
    else
    {
        return createHttpsServer(options, requestListener);
    }
};

for (const portNum of port)
{

    const server = createServer(async (req, res) =>
    {
        const context: any = {
            rawUrl: req.url || 'UNKNOWN',
        };

        if (req.url === undefined)
        {
            res.statusCode = 400;
            res.end();
            return;
        }

        const sourceIP = req.socket.remoteAddress ?? 'UNKNOWN';
        if (sourceIP === 'UNKNOWN')
        {
            res.statusCode = 400;
            res.end();
        }

        if (await ServerPersistentStorage.getConfigurationValue<boolean>('server-ddos-protection', false))
        {
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
        }

        if (process.env.CLUSTER_ID !== undefined)
        {
            res.setHeader('CLUSTER_ID', process.env.CLUSTER_ID);
        }

        for (const restrictor of pathRestrictors)
        {
            if (restrictor.pattern.test(req.url))
            {
                if (!restrictor.enabled)
                {
                    res.statusCode = 401;
                    res.end(JSON.stringify({
                        reason: 'Route Disabled',
                        message: restrictor.message
                    }));
                    return;
                }
            }
        }

        // Allow keep-alive
        res.setHeader('Connection', 'keep-alive');

        const maximumRequestTime = await ServerPersistentStorage.getConfigurationValue<number>("server-maximum-request-time", 60000);

        const failureTimeout = setTimeout(() =>
        {
            res.end(`Request timed out after ${maximumRequestTime}ms`);
        }, maximumRequestTime);

        const controllerArgs: ControllerArgs = {
            liftResponseTimeRestriction: () => { clearTimeout(failureTimeout); },
            connection: {
                request: req,
                response: res
            }
        };

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
                    if (handler.method)
                    {
                        const validMethods = AsArray(handler.method);
                        if (handler.method.indexOf(req.method ?? 'UNKNOWN') === -1)
                        {
                            continue;
                        }
                    }
                    if (handler)
                    {
                        try
                        {
                            const handlerResult = await handler.handler(req, res, controllerArgs);
                            if (handlerResult !== undefined && !res.writableEnded)
                            {
                                // If it's a string just send it
                                if (typeof handlerResult === 'string')
                                {
                                    res.end(handlerResult);
                                }
                                else if ('toJSON' in handlerResult)
                                {
                                    res.end(handlerResult.toJSON());
                                }
                                // If it's a buffer send it
                                else if (handlerResult instanceof Buffer)
                                {
                                    res.end(handlerResult);
                                }
                                // If it's a stream pipe it
                                else if (handlerResult instanceof fs.ReadStream)
                                {
                                    handlerResult.pipe(res);
                                    handlerResult.close();
                                }
                                // If it's a response object send it
                                else if (handlerResult instanceof Response)
                                {
                                    res.statusCode = handlerResult.status;
                                    res.end(handlerResult.body);
                                }
                                else if (handlerResult instanceof Boolean)
                                {
                                    res.end(handlerResult.toString());
                                }
                                // If it's a standard JSON object stringify it
                                else if (typeof handlerResult === 'object')
                                {
                                    res.end(JSON.stringify(handlerResult, undefined, 4));
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
                            if (e instanceof HTTPRequestFallthrough)
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
                            res.write(e.message);
                            res.end();
                            return;
                        }
                    }
                }

                if (!suspend404)
                {
                    console.error(`[${req.method}] ${req.url} => 404`);
                    res.statusCode = 404;
                    res.setHeader("INTERNAL-STATUS-CODE", "no-route");
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
            action();
        }
        clearTimeout(failureTimeout);// TODO: Fixme (doesn't work because async workload escapes this execution body)
    });
    serverStartupHandlers.push(() =>
    {
        server.listen(portNum, () =>
        {
            log('info', `Server listening on port ${portNum}`);
        });
    });
}

export function __startServer()
{
    if (isAlreadyStarted)
    {
        throw new Error(`Server is already started. `);
    }
    isAlreadyStarted = true;
    for (const action of serverStartupHandlers)
    {
        try { action(); } catch (e: any) { }
    }
}
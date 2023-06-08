import fs from 'fs';
import path from 'path';
import { ServerPersistentStorage } from './serverPersistentStorage.ts';
const log = ServerPersistentStorage.useLogger("Entry Point");

interface ITarget
{
    path: string;
    name: string;
    description: string;
}

let targets = [
    {
        path: "./server.ts",
        name: "Server Core",
        description: "Handles HTTP requests and routes them to the appropriate handler."
    },
    {
        path: "./serverLoad.ts",
        name: "Host Load",
        description: "Handles requests for server load."
    },
    {
        path: "./pushNotifications.ts",
        name: "Push Notifications",
        description: "Handles requests for push notifications."
    },
    {
        path: "./staticSiteServer.ts",
        name: "Static Site Server",
        description: "Serves static files from the react page."
    },
];

targets = await ServerPersistentStorage.getConfigurationValue<ITarget[]>("init-modules", targets);

log('info', `Starting server with ${targets.length} modules...`, targets);

const serverStart = Date.now();


for (const target of targets)
{
    try
    {
        await import(target.path);
    }
    catch (e: any)
    {
        console.error(`[LOADER] Failed to load module '${target.name}'`);
        console.error(e);
        log('error', `Failed to load module '${target.name}'`, e.message);
    }
}

log('info', `Server started in ${Date.now() - serverStart}ms`);

const ipAddressFetchPath = 'https://ipinfo.io/ip';
const ipAddress = await (await fetch(ipAddressFetchPath)).text();
log('info', `Server IP address: ${ipAddress}`);
import fs from 'fs';
import path from 'path';
import { availableParallelism } from 'node:os';
import { ServerPersistentStorage } from './core/database/serverPersistentStorage.js';
import { __startServer } from './core/server/server.js';
import cluster from 'node:cluster';
import { delay } from './shared/delay.js';
import { Worker } from 'cluster';

const log = await ServerPersistentStorage.useLogger("Entry Point");

interface ITarget
{
    path: string;
    name: string;
    description: string;
}

let targets = [
    {
        path: "./core/externalInitialization.js",
        name: "External Initialization",
        description: "Downloads and initializes external data."
    },
];

targets = await ServerPersistentStorage.getConfigurationValue<ITarget[]>("init-modules", targets);

log('info', `Starting server with ${targets.length} modules...`, targets);

let targetParallelism: number = await ServerPersistentStorage.getConfigurationValue<number>("target-parallelism", availableParallelism());

const workerOperation = async () =>
{
    const serverStart = Date.now();


    for (const target of targets)
    {
        try
        {
            await import(target.path);
        }
        catch (e: any)
        {
            log('error', `Failed to load module '${target.name}'`, {
                error: e.message,
                path: target.path
            });
        }
    }

    __startServer();
    log('info', `Server started in ${Date.now() - serverStart}ms`);
};

// Check if node's --inspect flag is set
const isDebugging = process.execArgv.some((arg) => arg.includes('--inspect'));
if (isDebugging)
{
    log('info', 'Debugging mode detected, starting single-threaded...');
    // Start single-threaded to allow deterministic debugging
    await workerOperation();
}
else if (cluster.isPrimary)
{
    let clusters: {
        id: number;
        worker: Worker;
    }[] = [];
    const startWorkers = async () =>
    {
        log('info', `Starting server with ${targetParallelism} parallel processes...`);
        for (let i = 0; i < targetParallelism; i++)
        {
            const worker = cluster.fork({
                ...process.env,
                CLUSTER_ID: i
            });
            clusters.push({
                id: i,
                worker: worker
            });

            worker.on('exit', async (code, signal) =>
            {
                log('info', `Worker ${i} died with code ${code} and signal ${signal}`);
                // If the config value 'restart-cluster-on-failure' is set to true, restart the cluster
                if (await ServerPersistentStorage.getConfigurationValue<boolean>("restart-cluster-on-failure", false))
                {
                    log('info', `Restarting cluster ${i}...`);
                    const newWorker = cluster.fork({
                        ...process.env,
                        CLUSTER_ID: i
                    });
                    clusters[ i ].worker = newWorker;
                }
            });
        }
    };
    await startWorkers();
    while (true)
    {
        await delay(60000);
        if (await ServerPersistentStorage.getConfigurationValue<boolean>('server-restart-flag', false))
        {
            await ServerPersistentStorage.setConfigurationValue('server-restart-flag', false);
            log('info', 'Restarting server...');
            for (const cluster of clusters)
            {
                cluster.worker.kill();
            }
            clusters = [];
            await startWorkers();
            await log('info', 'Server restarted: server-restart-flag was set to true');
        }
    }
}
else
{
    workerOperation();
}
import * as os from 'os';
import { serverDatabase } from './databaseConnectors.js';
import { Mutex } from 'async-mutex';
import { cache } from './cache.ts';
import { getDeviceIdentifier } from './deviceInfo.ts';
const configCollection = serverDatabase.collection('config');
const timingCollection = serverDatabase.collection('timings');

const configurationMutex = new Mutex();

interface IConfigEntry
{
    serverIdentifier: string;
    key: string;
    value: any;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export class ServerPersistentStorageController
{
    public static getServerIdentifier(): string
    {
        return getDeviceIdentifier().hostname;
    }

    public readonly serverIdentifier = ServerPersistentStorageController.getServerIdentifier();

    public constructor(serverIdentifier?: string)
    {
        if (serverIdentifier) this.serverIdentifier = serverIdentifier;
        else this.serverIdentifier = ServerPersistentStorageController.getServerIdentifier();
    }

    public async setConfigurationValue<T>(key: string, value: T): Promise<void>
    {
        const configEntry: IConfigEntry = { serverIdentifier: this.serverIdentifier, key, value };
        await configurationMutex.runExclusive(async () =>
        {
            await configCollection.updateOne({ serverIdentifier: ServerPersistentStorage.serverIdentifier, key }, { $set: configEntry }, { upsert: true });
        });
    }
    @cache(60000)
    public async getConfigurationValue<T>(key: string, defaultValue: T): Promise<T>
    {
        const configEntry = await configCollection.findOne({ serverIdentifier: ServerPersistentStorage.serverIdentifier, key });
        if (!configEntry)
        {
            // Set the default value
            await this.setConfigurationValue(key, defaultValue);
            return defaultValue;
        }
        return configEntry.value;
    }

    public async log(level: LogLevel, source: string, message: string, data?: any): Promise<void>
    {
        const logEntry = {
            serverIdentifier: this.serverIdentifier,
            level,
            source,
            message,
            data,
            timestamp: new Date()
        };

        console.log(`[${level}] ${message}`, data);

        await serverDatabase.collection('logs').insertOne(logEntry);
    }

    public async clearLogs(...targetLevels: LogLevel[]): Promise<void>
    {
        await serverDatabase.collection('logs').deleteMany({ serverIdentifier: ServerPersistentStorage.serverIdentifier, level: { $in: targetLevels } });
    }

    public async clearTimings(): Promise<void>
    {
        await serverDatabase.collection('timings').deleteMany({ serverIdentifier: ServerPersistentStorage.serverIdentifier });
    }

    public useLogger(source: string): (level: LogLevel, message: string, data?: any) => Promise<void>
    {
        return async (level, message, data) => await this.log(level, source, message, data);
    }

    public async timeOperation(operationGroup: string, action: () => any, context?: any)
    {
        const startTime = new Date();
        try
        {
            const result = await action();
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const entry = {
                serverIdentifier: ServerPersistentStorage.serverIdentifier,
                operationGroup,
                context,
                startTime,
                endTime,
                duration
            };
            await timingCollection.insertOne(entry);
            return result;
        }
        catch (e: any)
        {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const entry = {
                serverIdentifier: ServerPersistentStorage.serverIdentifier,
                operationGroup,
                context,
                startTime,
                endTime,
                duration,
                error: e.toString()
            };
            await timingCollection.insertOne(entry);
            throw e;
        }
    }

    public async copyServerConfiguration(to: string): Promise<void>
    {
        const configEntries = await configCollection.find({ serverIdentifier: this.serverIdentifier }).toArray();
        // Copy all entries to the new server
        for (const configEntry of configEntries)
        {
            const newConfigEntry = { ...configEntry, serverIdentifier: to, _id: undefined };
            await configCollection.insertOne(newConfigEntry);
        }
    }

    public collection(name: string)
    {
        return serverDatabase.collection(name);
    }
}

export const ServerPersistentStorage = new ServerPersistentStorageController();

console.log(`Server identifier: ${ServerPersistentStorage.serverIdentifier}`);
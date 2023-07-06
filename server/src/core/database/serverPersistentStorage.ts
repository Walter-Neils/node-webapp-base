import * as os from 'os';
import { serverDatabase } from './databaseConnectors.js';
import { Mutex } from 'async-mutex';
import { getDeviceIdentifier } from '../../misc/deviceInfo.js';
import { Impossible } from '../../shared/Impossible.js';
import { clearAllCachedMethodCalls, localCache } from '../cache.js';
import { DeepCopy } from '../../shared/DeepCopy.js';
import cluster from 'cluster';
const configCollection = serverDatabase.collection('configuration');
const timingCollection = serverDatabase.collection('timings');


const configurationMutex = new Mutex();

const localCacheTags = [ 'server-persistent-storage' ];


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
        clearAllCachedMethodCalls(localCacheTags);
        const configEntry: IConfigEntry = { serverIdentifier: this.serverIdentifier, key, value };
        await configurationMutex.runExclusive(async () =>
        {
            await configCollection.updateOne({ serverIdentifier: ServerPersistentStorage.serverIdentifier, key }, { $set: configEntry }, { upsert: true });
        });
    }
    @localCache(60000, localCacheTags)
    public async getConfigurationValue<T>(key: string, defaultValue: T): Promise<T>
    {
        const dbResult = await configurationMutex.runExclusive(async () =>
        {
            const configEntry = await configCollection.findOne({ serverIdentifier: ServerPersistentStorage.serverIdentifier, key });
            return configEntry;
        });
        if (!dbResult)
        {
            // Set the default value
            await this.setConfigurationValue(key, defaultValue);
            return defaultValue;
        }
        return dbResult.value;
    }

    @localCache(60000, localCacheTags)
    public async getConfigurationValueOrThrow<T>(key: string): Promise<T>
    {
        return await configurationMutex.runExclusive(async () =>
        {
            const configEntry = await configCollection.findOne({ serverIdentifier: ServerPersistentStorage.serverIdentifier, key });
            if (!configEntry)
            {
                throw new Error(`Required configuration value '${key}' not found`);
            }
            return configEntry.value;
        });
    }

    public async hasTag(tag: string)
    {
        const tags = await this.getConfigurationValue<string[]>("tags", []);
        return tags.some(x => x === tag);
    }

    public async removeTag(tag: string)
    {
        let tags = await this.getConfigurationValue<string[]>("tags", []);
        const newTags = tags.filter(x => x !== tag);
        if (newTags.length != tags.length)
        {
            await this.setConfigurationValue<string[]>("tags", newTags);
            return true;
        }
        return false;
    }

    public async addTag(tag: string)
    {
        let tags = await this.getConfigurationValue<string[]>("tags", []);
        let newTags = DeepCopy(tags);
        newTags.push(tag);
        newTags = newTags.filter((value, index) => newTags.indexOf(value) === index);
        if (newTags.length != tags.length)
        {
            await this.setConfigurationValue<string[]>("tags", newTags);
            return true;
        }
        return false;
    }

    public async setTags(tags: string[])
    {
        await this.setConfigurationValue<string[]>("tags", tags);
    }

    public async log(level: LogLevel, source: string, message: string, data?: any): Promise<void>
    {
        const logEntry = {
            serverIdentifier: this.serverIdentifier,
            level,
            source,
            message,
            data,
            timestamp: new Date(),
            clusterWorkerId: process.env.CLUSTER_ID!,
        };

        if (!logEntry.clusterWorkerId)
        {
            if (cluster.isPrimary)
            {
                logEntry.clusterWorkerId = 'primary';
            }
            else if (cluster.isWorker)
            {
                logEntry.clusterWorkerId = 'unknown-worker';
            }
            else
            {
                logEntry.clusterWorkerId = 'unclustered';
            }
        }

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

    public async useLogger(source: string): Promise<(level: LogLevel, message: string, data?: any) => Promise<void>>
    {
        const configKey = `logging-config`;
        const specificSourceKey = source.replaceAll(' ', '-').toLowerCase();
        type ConfigItem = { source: string, console: boolean; database: boolean; };
        const configItems: ConfigItem[] = await ServerPersistentStorage.getConfigurationValue<any>(configKey, []);
        let configItem: ConfigItem | undefined = configItems.find(x => x.source === specificSourceKey);
        if (configItem === undefined)
        {
            configItem = {
                source: specificSourceKey,
                console: true,
                database: true
            };
            configItems.push(configItem);
            await ServerPersistentStorage.setConfigurationValue(configKey, configItems);
        }
        return async (level, message, data) =>
        {
            if (configItem === undefined)
            {
                Impossible(`configItem cannot be undefined here`);
            }
            let dispMessage = `[${level}] ${message}`;
            if (configItem.console)
            {
                let consoleWriterHandler: (message: string, data?: any) => void;
                switch (level)
                {
                    case 'debug':
                        consoleWriterHandler = console.debug;
                        break;
                    case 'info':
                        consoleWriterHandler = console.info;
                        break;
                    case 'warn':
                        consoleWriterHandler = console.warn;
                        break;
                    case 'error':
                        consoleWriterHandler = console.error;
                        break;
                    default:
                        consoleWriterHandler = console.log;
                }
                if (data)
                {
                    consoleWriterHandler(dispMessage, data);
                }
                else
                {
                    consoleWriterHandler(dispMessage);
                }
            }
            if (configItem.database)
            {
                await this.log(level, source, dispMessage, data);
            }
        };
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

// Check if the 'logs' collection exists on the database. If not, create a new capped collection
const loggingCollectionExists = (await serverDatabase.listCollections({}, { nameOnly: true }).toArray()).some(x => x.name === 'logs');
if (!loggingCollectionExists)
{
    const cappedSize = await ServerPersistentStorage.getConfigurationValue<number>('logging-capped-size', 10000000); // 10MB
    // Create the collection
    await serverDatabase.createCollection('logs', { capped: true, size: cappedSize });
}
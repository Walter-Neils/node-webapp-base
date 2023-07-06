import { getMongoDatabase } from "./database/databaseConnectors.js";
import { DevExpose } from "../misc/Expose.js";

const cacheDB = await getMongoDatabase('Server');
const collection = cacheDB.collection<{ key: string, value: any; }>('cache');

interface CacheInstance
{
    cache: Map<any, any>,
    tags: string[],
    duration: number;
}

const cacheInstances: CacheInstance[] = [];

export function clearAllCachedMethodCalls(groups: string[])
{
    for (const instance of cacheInstances)
    {
        if (instance.tags.some(x => groups.some(v => x === v)))
        {
            instance.cache.clear();
            continue;
        }
    }
}

DevExpose((groups: string[]) =>
{
    console.log("Clearing cache for groups: ", groups);
    clearAllCachedMethodCalls(groups);
}, "clearAllCachedMethodCalls");

type SuccessfulResult<T> = {
    success: true;
    value: T;
};
type UnsuccessfulResult<T> = {
    success: false;
};
export function useSharedCache<T>(cacheIdentifier: string): [ (args: any[]) => Promise<SuccessfulResult<T> | UnsuccessfulResult<T>>, (args: any[], value: T) => Promise<void> ]
{

    const tryGetCachedResult = async (args: any[]): Promise<SuccessfulResult<T> | UnsuccessfulResult<T>> =>
    {
        const key = cacheIdentifier + '-' + JSON.stringify(args);

        const pipeline = [
            {
                $match: {
                    "key": key
                }
            }
        ];

        const results = await collection.aggregate(pipeline);

        if (!await results.hasNext())
        {
            return { success: false };
        }

        const result = (await results.next())!;

        return {
            success: true,
            value: result.value
        };
    };

    const addResultToCache = async (args: any[], value: any): Promise<void> =>
    {
        const key = cacheIdentifier + '-' + JSON.stringify(args);
        await collection.insertOne({
            key: key, value: value
        });
    };

    return [ tryGetCachedResult, addResultToCache ];
}

export function localCache(duration: number, tags: string[] = [])
{
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor)
    {
        const originalMethod = descriptor.value;
        const cache = new Map();
        const cacheName = `${target.constructor.name}.${propertyKey}`;
        const cacheInstance = {
            cache: cache,
            tags: tags,
            duration: duration
        };
        cacheInstances.push(cacheInstance);
        setInterval(() =>
        {
            const now = Date.now();
            for (const key of cache.keys())
            {
                const cached = cache.get(key);
                if (cached.timeStamp + duration < now)
                {
                    cache.delete(key);
                }
            }
        }, duration);
        const extendedDescriptor = (descriptor as any);
        extendedDescriptor.clearCache = () => cache.clear();
        extendedDescriptor.value = function (...args: any[])
        {
            const key = JSON.stringify(args);
            if (cache.has(key))
            {
                const cached = cache.get(key);
                if (cached.timeStamp + duration > Date.now())
                {
                    return cached.value;
                }
                else
                {
                    cache.delete(key);
                }
            }
            const result = originalMethod.apply(this, args);
            cache.set(key, {
                value: result,
                timeStamp: Date.now()
            });
            return result;
        };
        return extendedDescriptor;
    };
}
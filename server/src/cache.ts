interface CacheInstance
{
    cacheName: string;
    cacheDuration: number;
    cache: Map<any, any>;
}

const cacheInstances: CacheInstance[] = [];

export function clearAllCachedMethodCalls()
{
    for (const cache of cacheInstances)
    {
        cache.cache.clear();
    }
}

export function inspectCaches()
{
    return cacheInstances;
}


export function cache(duration: any)
{
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor)
    {
        const originalMethod = descriptor.value;
        const cache = new Map();
        const cacheName = `${target.constructor.name}.${propertyKey}`;
        cacheInstances.push({ cacheName, cacheDuration: duration, cache });

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

        descriptor.value = function (...args: any[])
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
        return descriptor;
    };
}
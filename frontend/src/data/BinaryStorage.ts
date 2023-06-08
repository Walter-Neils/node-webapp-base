export class BinaryStorage
{
    private dbName: string;
    private objectStoreName: string;
    private db: IDBDatabase | null = null;

    constructor(dbName: string, objectStoreName: string)
    {
        this.dbName = dbName;
        this.objectStoreName = objectStoreName;
    }

    public async open(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            const request = indexedDB.open(this.dbName);

            request.onerror = () =>
            {
                reject(new Error('Failed to open the database'));
            };

            request.onsuccess = () =>
            {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = () =>
            {
                this.db = request.result;
                if (!this.db.objectStoreNames.contains(this.objectStoreName))
                {
                    this.db.createObjectStore(this.objectStoreName);
                }
            };
        });
    }

    public close(): void
    {
        if (this.db)
        {
            this.db.close();
            this.db = null;
        }
    }

    public async set(key: string, value: ArrayBuffer): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            if (!this.db)
            {
                reject(new Error('Database is not open'));
                return;
            }

            const transaction = this.db.transaction(this.objectStoreName, 'readwrite');
            const objectStore = transaction.objectStore(this.objectStoreName);
            const request = objectStore.put(value, key);

            request.onerror = () =>
            {
                reject(new Error('Failed to set the value'));
            };

            request.onsuccess = () =>
            {
                resolve();
            };
        });
    }

    public async setObject(key: string, value: object): Promise<void>
    {
        return this.set(key, convertStringToBinary(JSON.stringify(value)));
    }

    public async setBlob(key: string, value: Blob): Promise<void>
    {
        return this.set(key, await value.arrayBuffer());
    }

    public async get(key: string): Promise<ArrayBuffer | null>
    {
        return new Promise<ArrayBuffer | null>((resolve, reject) =>
        {
            if (!this.db)
            {
                reject(new Error('Database is not open'));
                return;
            }

            const transaction = this.db.transaction(this.objectStoreName, 'readonly');
            const objectStore = transaction.objectStore(this.objectStoreName);
            const request = objectStore.get(key);

            request.onerror = () =>
            {
                reject(new Error('Failed to get the value'));
            };

            request.onsuccess = () =>
            {
                const result = request.result;
                resolve(result instanceof ArrayBuffer ? result : null);
            };
        });
    }

    public async getObject<T>(key: string): Promise<T | null>
    {
        const result = await this.get(key);
        if (result === null)
        {
            return null;
        }

        const decoder = new TextDecoder();
        const decodedData = decoder.decode(result);
        return JSON.parse(decodedData) as T;
    }

    public async getBlob(key: string): Promise<Blob | null>
    {
        const result = await this.get(key);
        if (result === null)
        {
            return null;
        }

        return new Blob([ result ]);
    }

    public async remove(key: string): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            if (!this.db)
            {
                reject(new Error('Database is not open'));
                return;
            }

            const transaction = this.db.transaction(this.objectStoreName, 'readwrite');
            const objectStore = transaction.objectStore(this.objectStoreName);
            const request = objectStore.delete(key);

            request.onerror = () =>
            {
                reject(new Error('Failed to remove the key'));
            };

            request.onsuccess = () =>
            {
                resolve();
            };
        });
    }

    public async exists(key: string): Promise<boolean>
    {
        return new Promise<boolean>((resolve, reject) =>
        {
            if (!this.db)
            {
                reject(new Error('Database is not open'));
                return;
            }

            const transaction = this.db.transaction(this.objectStoreName, 'readonly');
            const objectStore = transaction.objectStore(this.objectStoreName);
            const request = objectStore.get(key);

            request.onerror = () =>
            {
                reject(new Error('Failed to check key existence'));
            };

            request.onsuccess = () =>
            {
                const result = request.result;
                resolve(result !== undefined);
            };
        });
    }
}


export function convertStringToBinary(input: string): ArrayBuffer
{
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(input);
    return encodedData.buffer;
}

import { useEffect, useState } from "react";

type SessionStorageConfiguration<T> = {
    key: string;
    defaultValue: T;
};

export default function useSessionStorage<T>(configuration: SessionStorageConfiguration<T>)
{
    const [ value, setValue ] = useState<T>(() =>
    {
        const storedValue = sessionStorage.getItem(configuration.key);
        if (storedValue)
        {
            return JSON.parse(storedValue);
        }
        else
        {
            return configuration.defaultValue;
        }
    });

    useEffect(() =>
    {
        sessionStorage.setItem(configuration.key, JSON.stringify(value));
    }, [ value, configuration.key ]);

    return [ value, setValue ] as const;
}
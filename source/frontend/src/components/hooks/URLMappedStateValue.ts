import React, { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Buffer } from 'buffer';

export function useURLMappedBooleanStateValue(key: string, defaultValue?: boolean)
{
    return useURLMappedStateValue<boolean>(key, (value) =>
    {
        return value ? "true" : "false";
    }, (value) =>
    {
        if (value === undefined || value === null)
        {
            if (defaultValue === undefined)
            {
                throw new Error(`Failed to load URL mapped state value: '${key}' was not present in the URL, and no default was specified.`);
            }
            return defaultValue;
        }
        else
            return value === "true";
    });
}

export function useURLMappedArrayStateValue<T>(key: string, defaultValue?: T[])
{
    return useURLMappedStateValue<T[]>(key, (value) =>
    {
        return JSON.stringify(value);
    }, (value) =>
    {
        if (value === undefined || value === null)
        {
            if (defaultValue === undefined)
            {
                throw new Error(`Failed to load URL mapped state value: '${key}' was not present in the URL, and no default was specified.`);
            }
            return defaultValue;
        }
        else
            return JSON.parse(value) as T[];
    });
}

export function useURLMappedStateValue<T>(
    key: string,
    serializer?: (value: T) => string,
    deserializer?: (value?: string) => T
)
{
    const location = useLocation();
    const navigate = useNavigate();

    const serialize = useCallback(
        (value: T) =>
        {
            if (serializer) return serializer(value);
            else if (value === undefined || value === null)
            {
                throw new Error(`Attempted to serialize undefined/null value for key '${key}'. If you want to allow undefined/null values, you must provide a custom serializer and deserializer.`);
            }
            return JSON.stringify(value);
        },
        [ serializer, key ]
    );

    const deserialize = useCallback(
        (value?: string) =>
        {
            if (deserializer) return deserializer(value);
            else if (value === undefined || value === null)
            {
                throw new Error(`Attempted to deserialize undefined/null value for key '${key}'. If you want to allow undefined/null values, you must provide a custom serializer and deserializer.`);
            }
            return JSON.parse(value) as T;
        },
        [ deserializer, key ]
    );

    const [ value, setValue ] = React.useState<T>(() =>
    {
        const params = new URLSearchParams(location.search);
        let value: string | null | undefined = params.get(key);
        if (value === null)
        {
            value = undefined;
        }
        const transformedValue = deserialize(value);
        return transformedValue;
    });

    const [ wasLastValueOurs, setWasLastValueOurs ] = React.useState<boolean>(true);

    useEffect(() =>
    {
        if (wasLastValueOurs)
        {
            setWasLastValueOurs(false);
            return;
        }
        console.log(`Loading ${key} from URL`);

        const params = new URLSearchParams(location.search);
        let value: string | null | undefined = params.get(key);
        if (value === null)
        {
            value = undefined;
        }
        const transformedValue = deserialize(value);
        setValue(transformedValue);
        // setIgnored(x => x + 1);
    }, [ location, deserialize, key, wasLastValueOurs ]);

    useEffect(() =>
    {
        setWasLastValueOurs(true);

        const params = new URLSearchParams(location.search);
        const serializedValue = serialize(value);
        if (serializedValue === undefined || serializedValue === null)
        {
            params.delete(key);
        } else
        {
            params.set(key, serializedValue);
        }
        // If the new params are the same as the old params, then don't navigate
        if (params.toString() !== location.search)
        {
            console.log(`Saving ${key} to URL`);
            navigate(`?${params.toString()}`, { replace: true });
        }
    }, [ value, key, location, navigate, serialize ]);

    return [ value, setValue ] as const;
}


export function useURLMappedBase64Value<T>(key: string, defaultValue?: T)
{
    key = Buffer.from(key).toString("base64");
    return useURLMappedStateValue<T>(key, (value) =>
    {
        const stringRepresentation = JSON.stringify(value);
        const encoded = Buffer.from(stringRepresentation).toString("base64");
        return encoded;
    }, (value) =>
    {
        if (value === undefined || value === null)
        {
            if (defaultValue === undefined)
            {
                throw new Error(`Failed to load URL mapped state value: '${key}' was not present in the URL, and no default was specified.`);
            }
            return defaultValue;
        }
        else
        {
            const decoded = Buffer.from(value, "base64").toString("utf-8");
            const parsed = JSON.parse(decoded);
            return parsed as T;
        }
    });
}

export function useURLMappedBase64Number(key: string, defaultValue?: number)
{
    key = Buffer.from(key).toString("base64");
    return useURLMappedStateValue<number>(key, (value) =>
    {
        const stringRepresentation = value.toString();
        const encoded = Buffer.from(stringRepresentation).toString("base64");
        return encoded;
    }, (value) =>
    {
        if (value === undefined || value === null)
        {
            if (defaultValue === undefined)
            {
                throw new Error(`Failed to load URL mapped state value: '${key}' was not present in the URL, and no default was specified.`);
            }
            return defaultValue;
        }
        else
        {
            const decoded = Buffer.from(value, "base64").toString("utf-8");
            const parsed = Number(decoded);
            return parsed;
        }
    });
}

export function useURLMappedBase64Boolean(key: string, defaultValue?: boolean)
{
    key = Buffer.from(key).toString("base64");
    return useURLMappedStateValue<boolean>(key, (value) =>
    {
        const stringRepresentation = value ? "true" : "false";
        const encoded = Buffer.from(stringRepresentation).toString("base64");
        return encoded;
    }, (value) =>
    {
        if (value === undefined || value === null)
            return defaultValue ?? false;
        else
        {
            const decoded = Buffer.from(value, "base64").toString("utf-8");
            const parsed = decoded === "true";
            return parsed;
        }
    });
}

export class URLMappedValueIntentBuilder
{
    private urlParams: URLSearchParams = new URLSearchParams();

    public setBase64Value(key: string, value: any)
    {
        key = Buffer.from(key).toString("base64");
        const stringRepresentation = JSON.stringify(value);
        const encoded = Buffer.from(stringRepresentation).toString("base64");
        this.urlParams.set(key, encoded);
        return this;
    }

    public setBase64Number(key: string, value: number)
    {
        key = Buffer.from(key).toString("base64");
        const stringRepresentation = value.toString();
        const encoded = Buffer.from(stringRepresentation).toString("base64");
        this.urlParams.set(key, encoded);
        return this;
    }

    public setBase64Boolean(key: string, value: boolean)
    {
        key = Buffer.from(key).toString("base64");
        const stringRepresentation = value ? "true" : "false";
        const encoded = Buffer.from(stringRepresentation).toString("base64");
        this.urlParams.set(key, encoded);
        return this;
    }

    public setBoolean(key: string, value: boolean)
    {
        const stringRepresentation = value ? "true" : "false";
        this.urlParams.set(key, stringRepresentation);
        return this;
    }

    public setNumber(key: string, value: number)
    {
        const stringRepresentation = value.toString();
        this.urlParams.set(key, stringRepresentation);
        return this;
    }

    public setValue(key: string, value: any)
    {
        const stringRepresentation = JSON.stringify(value);
        this.urlParams.set(key, stringRepresentation);
        return this;
    }

    public build()
    {
        return this.urlParams.toString();
    }
}

URLMappedValueIntentBuilder.prototype.toString = function ()
{
    return this.build();
};
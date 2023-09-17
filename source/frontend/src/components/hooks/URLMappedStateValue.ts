import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Buffer } from 'buffer';

export type URLMappedValueConfiguration<T> = {
    /**
     * The key of the URL parameter.
     */
    key: string;
} & {
    /**
     * The behaviour of the browser history when the value is changed.
     */
    navigationBehaviour: 'keep' | 'replace';
} & (
        {
            /**
             * The behaviour when the URL parameter is not set. 
             */
            nullBehaviour: 'default';
            /**
             * The default value to use when the URL parameter is not set.
             */
            defaultValue: T;
        }
        | {
            /**
             * The behaviour when the URL parameter is not set.
             */
            nullBehaviour: 'throw';
        } | {
            /**
             * The behaviour when the URL parameter is not set.
             */
            nullBehaviour: 'allow';
        }
    ) & (
        {
            /**
             * The behaviour to use when the value is initialized
             */
            initializationBehaviour: 'default';
            /**
             * The default value to use when the value is initialized.
             */
            defaultValue: T;
        } | ({
            /**
             * The behaviour to use when the value is initialized
             */
            initializationBehaviour: 'load-from-url';
        } & (
                {
                    /**
                     * The behaviour when the URL parameter is not set during initialization.
                     */
                    initializationValueMissingBehaviour: 'null';
                } | {
                    /**
                     * The behaviour when the URL parameter is not set during initialization.
                     */
                    initializationValueMissingBehaviour: 'throw';
                }
            ))
    ) & (
        {
            /**
             * How the value is stored in the URL.
             */
            valueMode: 'json';
        } | {
            /**
             * How the value is stored in the URL.
             */
            valueMode: 'base64';
        } | {
            /**
             * How the value is stored in the URL.
             */
            valueMode: 'string';
        } | {
            /**
             * How the value is stored in the URL.
             */
            valueMode: 'number';
        } | {
            /**
             * 
             */
            valueMode: 'boolean';
        }
    );

/**
 * Creates a state value that is mapped to a URL parameter.
 * @param configuration The configuration for the URL mapped value.
 * @returns A tuple containing the current value and a function to set the value.
 */
export function useURLMappedStateValue<T>(configuration: URLMappedValueConfiguration<T>): [ T, (value: T) => void ]
{
    const location = useLocation();

    const urlParams = React.useMemo(() =>
    {
        return new URLSearchParams(location.search);
    }, [ location.search ]);

    const initializeValue = React.useCallback(() =>
    {
        if (configuration.initializationBehaviour === 'load-from-url')
        {
            const value = urlParams.get(configuration.key);
            if (value === null)
            {
                if (configuration.initializationValueMissingBehaviour === 'null')
                {
                    return null;
                }
                else if (configuration.initializationValueMissingBehaviour === 'throw')
                {
                    throw new Error(`URL parameter ${configuration.key} is missing`);
                }
            }
            else
            {
                if (configuration.valueMode === 'json')
                {
                    return JSON.parse(value);
                }
                else if (configuration.valueMode === 'base64')
                {
                    const decoded = Buffer.from(value, "base64").toString("utf-8");
                    return JSON.parse(decoded);
                }
                else if (configuration.valueMode === 'string')
                {
                    return value;
                }
                else if (configuration.valueMode === 'number')
                {
                    return Number(value);
                }
                else if (configuration.valueMode === 'boolean')
                {
                    return value === 'true';
                }
            }
        }
        else if (configuration.initializationBehaviour === 'default')
        {
            return configuration.defaultValue;
        }
        // Need to disable ESLINT because otherwise it complains about not referencing disciminated fields
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ configuration.initializationBehaviour, configuration.valueMode, configuration.key, urlParams ]);

    const [ currentValue, setCurrentValue ] = React.useState<T>(initializeValue);

    const navigate = useNavigate();

    const liveState = React.useRef({
        syncFromURLDisabled: configuration.initializationBehaviour === 'load-from-url',
        syncToURLDisabled: false
    });

    React.useEffect(() =>
    {
        if (liveState.current.syncFromURLDisabled)
        {
            liveState.current.syncFromURLDisabled = false;
            return;
        }

        const value = urlParams.get(configuration.key);
        if (value === null)
        {
            if (configuration.nullBehaviour === 'throw')
            {
                throw new Error(`URL parameter ${configuration.key} is missing`);
            }
            else if (configuration.nullBehaviour === 'default')
            {
                setCurrentValue(configuration.defaultValue);
            }
        }
        else
        {
            if (configuration.valueMode === 'json')
            {
                setCurrentValue(JSON.parse(value));
            }
            else if (configuration.valueMode === 'base64')
            {
                const decoded = Buffer.from(value, "base64").toString("utf-8");
                setCurrentValue(JSON.parse(decoded));
            }
            else if (configuration.valueMode === 'string')
            {
                setCurrentValue(value as T);
            }
            else if (configuration.valueMode === 'number')
            {
                setCurrentValue(Number(value) as T);
            }
            else if (configuration.valueMode === 'boolean')
            {
                setCurrentValue((value === 'true') as T);
            }
        }
        // Need to disable ESLINT because otherwise it complains about not referencing disciminated fields
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ location.search ]);

    React.useEffect(() =>
    {
        if (liveState.current.syncToURLDisabled)
        {
            liveState.current.syncToURLDisabled = false;
            return;
        }

        liveState.current.syncFromURLDisabled = true;

        if (configuration.valueMode === 'json')
        {
            const encoded = JSON.stringify(currentValue);
            urlParams.set(configuration.key, encoded);
        }
        else if (configuration.valueMode === 'base64')
        {
            const encoded = Buffer.from(JSON.stringify(currentValue)).toString("base64");
            urlParams.set(configuration.key, encoded);
        }
        else if (configuration.valueMode === 'string')
        {
            urlParams.set(configuration.key, currentValue as unknown as string);
        }
        else if (configuration.valueMode === 'number')
        {
            urlParams.set(configuration.key, (currentValue as number).toString());
        }
        else if (configuration.valueMode === 'boolean')
        {
            urlParams.set(configuration.key, (currentValue as unknown as boolean) ? 'true' : 'false');
        }

        const newUrl = `${location.pathname}?${urlParams.toString()}`;
        navigate(newUrl, { replace: configuration.navigationBehaviour === 'replace' });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ currentValue ]);

    return [ currentValue, setCurrentValue ];
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
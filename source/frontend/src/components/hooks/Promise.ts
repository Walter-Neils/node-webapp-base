import { useEffect, useState } from "react";
import React from "react";

export type PromiseHookValue<T> = {
    state: 'idle',
} | {
    state: 'pending',
} | {
    state: 'fulfilled',
    value: T,
} | {
    state: 'rejected',
    error: any,
};

export type PromiseHookSetter<T> = (newPromise: Promise<T>) => Promise<T>;
export type PromiseHookResetter = () => void;
export type PromiseHook<T> = [ PromiseHookValue<T>, PromiseHookSetter<T>, PromiseHookResetter ];

export type PromiseHookDefaultValue<T> = () => Promise<T>;

export function usePromise<T>(defaultValue?: PromiseHookDefaultValue<T>): PromiseHook<T>
{
    const [ value, setValue ] = useState<PromiseHookValue<T>>({
        state: 'idle',
    });

    const internalValueSetterRef = React.useRef<typeof setValue>(setValue);

    useEffect(() =>
    {
        internalValueSetterRef.current = setValue;

        return () =>
        {
            internalValueSetterRef.current = () =>
            {
                console.warn('PromiseHook: internalValueSetterRef.current is called after unmounting');
            };
        };
    }, []);

    const setter: PromiseHookSetter<T> = async (newPromise) =>
    {
        internalValueSetterRef.current({
            state: 'pending',
        });

        try
        {
            const value = await newPromise;
            internalValueSetterRef.current({
                state: 'fulfilled',
                value,
            });
            return value;
        }
        catch (error)
        {
            internalValueSetterRef.current({
                state: 'rejected',
                error,
            });
            throw error;
        }
    };

    const resetter: PromiseHookResetter = () =>
    {
        internalValueSetterRef.current({
            state: 'idle',
        });
    };

    useEffect(() =>
    {
        if (defaultValue !== undefined)
        {
            setter(defaultValue());
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [ value, setter, resetter ];
}
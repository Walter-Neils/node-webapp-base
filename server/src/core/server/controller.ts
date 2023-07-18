import { IncomingMessage, ServerResponse } from "node:http";

export class Controller
{
    private mContextValues: Map<string, any> = new Map();
    private args: ControllerArgs;

    public get request() { return this.args.connection.request; }
    public get response() { return this.args.connection.response; };

    public constructor(args: ControllerArgs)
    {
        this.mContextValues = new Map();
        this.args = args;
    }

    /**
     * Lifts the response time restriction for the current request
     */
    protected liftResponseTimeRestriction()
    {
        this.args.liftResponseTimeRestriction();
    }

    public get isControllerContextAvailable(): boolean | undefined
    {
        return this.mContextValues != undefined && this.mContextValues.set != undefined;
    }

    public setControllerContextValue<ValueType>(key: string, value: ValueType)
    {
        this.mContextValues.set(key, value);
    }

    public initControllerContextValue(key: string, value: any)
    {
        if (this.mContextValues.has(key))
        {
            throw new Error(`Key '${key}' has already been initialized`);
        }
        this.setControllerContextValue(key, value);
    }

    public getControllerContextValue<T>(key: string): T | undefined
    {
        return this.mContextValues.get(key);
    }

    public getRequiredControllerContextValue<T>(key: string): T
    {
        if (!this.mContextValues.has(key))
        {
            throw new Error(`Required context value '${key}' is not present.`);
        }

        return this.getControllerContextValue(key)!;
    }

    public getControllerValueMap()
    {
        return this.mContextValues;
    }
}


export type ControllerArgs = {
    liftResponseTimeRestriction: () => void;
    connection: {
        request: IncomingMessage,
        response: ServerResponse;
    };
};

export enum ControllerContextOffset
{
    GetContextValue = 0,
    GetRequiredContextValue = 1,
    SetContextValue = 2
}

/**
 * Use controller context in a type-safe manner
 * @param target The target controller who's context will be used
 */
export function UseControllerContext<KeyType extends string>(target: Controller): [ <ResultType>(key: KeyType) => ResultType | undefined, <ResultType>(key: KeyType) => ResultType, <ValueType>(key: KeyType, value: ValueType) => void ]
{
    const getContextValue = <ResultType>(key: KeyType) =>
    {
        return target.getControllerContextValue<ResultType>(key);
    };

    const getRequiredContextValue = <ResultType>(key: KeyType) =>
    {
        return target.getRequiredControllerContextValue<ResultType>(key);
    };

    const setContextValue = <ValueType>(key: KeyType, value: ValueType) =>
    {
        target.setControllerContextValue(key, value);
    };

    return [
        getContextValue,
        getRequiredContextValue,
        setContextValue
    ];
}
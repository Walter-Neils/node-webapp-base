/**
 * Yield execution to the event loop.
 */
export function YieldExecution(): Promise<void>
{
    return new Promise<void>((resolve) =>
    {
        setImmediate(resolve);
    });
}
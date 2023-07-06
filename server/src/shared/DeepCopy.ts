export function DeepCopy<T>(value: T): T
{
    return JSON.parse(JSON.stringify(value));
}
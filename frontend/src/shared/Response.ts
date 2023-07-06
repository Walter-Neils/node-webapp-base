export interface IResponse
{
    result: any;
}

export interface IResponseFailure
{
    reason: string;
    tracebackID?: string;
}

export type Response = IResponse | IResponseFailure;

export type Test = Unionize<Response>;

export function ResponseIndicatesSuccess(response: Response)
{
    if ('reason' in response)
    {
        return false;
    }
    return true;
}
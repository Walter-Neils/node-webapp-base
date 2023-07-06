export interface IResponse
{
    success: true | false;
}

export interface IResponseSuccess extends IResponse
{
    success: true;
    result: any;
}

export interface IResponseFailure extends IResponse
{
    success: false;
    reason: string;
}
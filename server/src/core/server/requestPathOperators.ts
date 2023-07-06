/**
 * When thrown from a handler, the server will continue to look for another handler to handle the request as if the handler did not exist.
 */
export class HTTPRequestFallthrough
{
    public message?: string;
    constructor(message?: string)
    {
        this.message = message;
    }
}

/**
 * When thrown from a handler, the server will redirect the request to the specified URL.
 */
export class HTTPInternalRedirect
{
    public toURL: string;
    constructor(toURL: string)
    {
        this.toURL = toURL;
    }
}
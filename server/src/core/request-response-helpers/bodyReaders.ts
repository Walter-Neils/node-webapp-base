import { IncomingMessage } from "http";

export async function readBodyAsString(req: IncomingMessage)
{
    return new Promise<string>((resolve, reject) =>
    {
        let body = '';
        req.on('data', chunk =>
        {
            body += chunk.toString();
        });
        req.on('end', () =>
        {
            resolve(body);
        });
        req.on('error', err =>
        {
            reject(err);
        });
    });
}
export async function readBodyAsJSON<T>(req: IncomingMessage)
{
    const body = await readBodyAsString(req);
    return JSON.parse(body) as T;
}

export async function readBodyAsBinary(req: IncomingMessage)
{
    return new Promise<Buffer>((resolve, reject) =>
    {
        let body: Buffer[] = [];
        req.on('data', chunk =>
        {
            body.push(chunk);
        });
        req.on('end', () =>
        {
            resolve(Buffer.concat(body));
        });
        req.on('error', err =>
        {
            reject(err);
        });
    });
}
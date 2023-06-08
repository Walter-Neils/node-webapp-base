import { ServerResponse } from "http";

export async function FailReason(res: ServerResponse, reason: string, code: number = 500)
{
    res.statusCode = code;
    res.end(reason);
}

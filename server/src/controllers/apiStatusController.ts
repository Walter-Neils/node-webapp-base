import { IncomingMessage, ServerResponse } from "http";
import { route } from "../core/server/server.js";

class APIStatus
{
    @route({ pathRegex: /\/api\/status\/available/ })
    public async health(req: IncomingMessage, res: ServerResponse)
    {
        res.end('true');
    }
    // API Failures
    @route({ pathRegex: /\/api\/failures/ })
    public async failures(req: IncomingMessage, res: ServerResponse)
    {
        res.end('[]');
    }

    // Path /status/version
    @route({ pathRegex: /\/api\/status\/version/ })
    public async version(req: IncomingMessage, res: ServerResponse)
    {
        res.end('1.0.0');
    }
}
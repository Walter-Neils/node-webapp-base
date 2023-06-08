import { route } from "./server.ts";
import { IncomingMessage, ServerResponse } from "http";
import os from "os";

class ServerLoad
{
    // Route: /api/serverLoad
    @route({ pathRegex: /^\/api\/serverLoad$/, methods: "GET" })
    public async ServerLoad(req: IncomingMessage, res: ServerResponse)
    {
        let fullResult: any = {};
        {
            fullResult[ "os" ] = {};
            let result = fullResult[ "os" ];
            result[ "platform" ] = os.platform();
            result[ "hostname" ] = os.hostname();
            result[ "uptime" ] = os.uptime();
            result[ "loadavg" ] = os.loadavg();
            result[ "cpuUsage" ] = os.loadavg()[ 0 ] / os.cpus().length;
            result[ "totalmem" ] = os.totalmem();
            result[ "freemem" ] = os.freemem();
            result[ "usedmem" ] = os.totalmem() - os.freemem();
            result[ "memUsage" ] = (os.totalmem() - os.freemem()) / os.totalmem();
            result[ "cpu" ] = os.cpus().map(x => x.model).pop();
            result[ "cpuSpeeds" ] = os.cpus().map(x => x.speed);
        }
        {
            fullResult[ "process" ] = {};
            let result = fullResult[ "process" ];
            result[ "uptime" ] = process.uptime();
            result[ "memoryUsage" ] = process.memoryUsage();
            result[ "cpuUsage" ] = process.cpuUsage();
        }
        return fullResult;
    }
}
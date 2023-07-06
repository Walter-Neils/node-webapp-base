import { IncomingMessage, ServerResponse } from "http";
import { ControllerArgs } from "./controller.js";

export interface PathHandler
{
    pathRegex: RegExp;
    handler: (req: IncomingMessage, res: ServerResponse, controllerArgs: ControllerArgs) => Promise<any>;
    priority: number;
    method: string | string[] | undefined;
}
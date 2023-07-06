import { IncomingMessage, ServerResponse } from 'http';
import { Controller } from './controller.js';





export interface ControllerContextProvider
{
    name: string;
    provider: (req: IncomingMessage, res: ServerResponse, target: Controller) => Promise<void>;
}

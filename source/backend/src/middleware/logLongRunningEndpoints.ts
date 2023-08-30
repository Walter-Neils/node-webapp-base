import { expressApp } from "../core/express.js";
import { logger } from "../core/logging.js";

expressApp.use(async (req, res, next) =>
{
    const start = Date.now();
    res.on('finish', () =>
    {
        const elapsed = Date.now() - start;
        if (elapsed > 1000)
        {
            req.logger.warn(`Operation took ${elapsed}ms`, {
                start: start,
                end: Date.now(),
                elapsed: elapsed,
            });
        }
    });
    next();
});
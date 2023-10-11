import { expressApp } from '../core/express.js';

export interface ExpressSession {}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			session: Partial<ExpressSession>;
		}
	}
}

expressApp.use(async (req, _res, next) => {
	req.session = {};
	next();
});

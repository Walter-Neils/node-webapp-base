import { expressApp } from '../core/express.js';
import { IncomingHttpHeaders } from 'http';

type RequestStatus = {
	start: number;
	url: string;
	headers: IncomingHttpHeaders;
} & (
	| {
			status: 'working';
	  }
	| {
			status: 'done';
			elapsed: number;
	  }
);

const requests: WeakRef<RequestStatus>[] = [];

expressApp.use(async (req, res, next) => {
	const start = Date.now();
	const requestStatus: RequestStatus = {
		start: start,
		status: 'working',
		url: req.url,
		headers: req.headers,
	} as RequestStatus;
	requests.push(new WeakRef(requestStatus));
	res.on('finish', () => {
		requestStatus.status = 'done';
		if (requestStatus.status !== 'done') {
			throw new Error('Assertion failed');
		}
		requestStatus.elapsed = Date.now() - start;
	});
	next();
});

expressApp.get('/metrics', async (req, res) => {
	const statusObjects = requests
		.map(request => request.deref())
		.filter(x => x !== undefined) as RequestStatus[];

	res.status(200);
	res.json(statusObjects);
	res.end();
});

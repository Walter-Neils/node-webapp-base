import { nextTick } from 'process';

const applicationStartTimestamp = Date.now();

let previousEventLoopEnd = applicationStartTimestamp;

function updateEventLoopTimeMetrics() {
	const now = Date.now();
	previousEventLoopEnd = now;
	setImmediate(() => {
		nextTick(updateEventLoopTimeMetrics);
	});
}

updateEventLoopTimeMetrics();

class TimeMetrics {
	public get currentLoopDuration(): number {
		return Date.now() - previousEventLoopEnd;
	}

	public get applicationUptime(): number {
		return Date.now() - applicationStartTimestamp;
	}
}

export default new TimeMetrics();

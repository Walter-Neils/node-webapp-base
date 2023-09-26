import { expressApp } from '../core/express.js';
import timeMetrics from '../core/timeMetrics.js';

expressApp.get('/test', async (req, res) => {
	res.standardFormat.success.json({
		applicationUptime: timeMetrics.applicationUptime,
		currentLoopDuration: timeMetrics.currentLoopDuration,
	});
});

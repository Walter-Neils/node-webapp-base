import { expressApp } from '../core/express.js';
import timeMetrics from '../core/timeMetrics.js';

expressApp.get('/test', async (req, res) => {
	res.send(timeMetrics.currentLoopDuration.toString());
	res.end();
});

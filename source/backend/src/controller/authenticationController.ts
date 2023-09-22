import { expressApp } from '../core/express.js';

expressApp.get('/api/auth', async (req, res) =>
{
	res.standardFormat.success.json({
		authenticated: true,
	});
});

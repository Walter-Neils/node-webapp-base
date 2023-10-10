import { expressApp } from '../core/express.js';

expressApp.get('/api/user', (req, res) => {
	res.write('Hello World');
	res.end();
});

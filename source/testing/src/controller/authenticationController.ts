import { expressApp } from '../core/express.js';
import { registerAPIEndpoint } from './apiDocumentationController.js';

expressApp.get('/api/auth', async (req, res) => {
	res.standardFormat.success.json({
		authenticated: true,
	});
});

registerAPIEndpoint({
	name: 'getAuthStatus',
	method: 'GET',
	path: [
		{
			type: 'literal',
			value: 'api',
		},
		{
			type: 'literal',
			value: 'auth',
		},
	],
	queryParameters: [],
	response: {
		type: 'object',
		properties: {
			authenticated: {
				type: 'boolean',
			},
		},
	},
});

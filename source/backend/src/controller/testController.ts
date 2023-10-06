import { expressApp } from '../core/express.js';
import { registerAPIEndpoint } from './apiDocumentationController.js';

expressApp.get('/test/:target', async (req, res) => {
	res.standardFormat.success.json({
		test: 'test',
		target: Number(req.params.target),
	});
});

registerAPIEndpoint({
	name: 'test',
	path: [
		{ type: 'literal', value: 'test' },
		{
			type: 'parameter',
			paramName: 'target',
			valueType: { type: 'number' },
		},
	],
	method: 'GET',
	response: { type: 'string' },
});

import { expressApp } from '../core/express.js';
import { registerAPIEndpoint } from './apiDocumentationController.js';

expressApp.get('/test/:target', async (req, res) => {
	res.standardFormat.success.json({
		test: 'test',
		target: Number(req.params.target),
	});
});

registerAPIEndpoint({
	path: [
		{
			type: 'literal',
			value: 'test',
		},
		{
			type: 'parameter',
			paramName: 'target',
			valueType: {
				type: 'number',
			},
		},
	],
	method: 'GET',
	queryParameters: [
		{
			name: 'testing',
			type: {
				type: 'string',
			},
		},
	],
	name: 'test',
	response: {
		type: 'object',
		properties: {
			test: {
				type: 'string',
			},
			target: {
				type: 'number',
			},
		},
	},
	body: {
		type: 'string',
	},
});

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
	documentation: {
		type: 'method',
		parameters: {
			target: 'The target number',
		},
	},
	path: [
		{ type: 'literal', value: 'test' },
		{
			type: 'parameter',
			paramName: 'target',
			valueType: { type: 'number' },
			documentation: {
				type: 'descriptiononly',
				description: 'The target number',
			},
		},
	],
	method: 'GET',
	response: { type: 'string' },
	cacheBehaviour: {
		cache: true,
		maximumAge: 1000,
		refreshAge: 100,
		groups: ['test'],
	},
});

import { configurationManager } from '../core/configuration/ConfigurationManager.js';
import { expressApp } from '../core/express.js';

declare module '../core/configuration/ConfigurationManager.js' {
	interface Configuration {
		test: string;
	}
}

expressApp.get('/api/user', async (req, res) => {
	res.write(
		await configurationManager.getConfigurationValueOrSetDefault(
			'test',
			() => 'test',
		),
	);
	res.end();
});

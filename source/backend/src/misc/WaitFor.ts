import yieldExecution from './yieldExecution.js';

export default async function waitFor(
	condition: () => Promise<boolean> | boolean,
	timeout?: number,
) {
	const startTime = Date.now();
	// eslint-disable-next-line no-constant-condition
	while (true) {
		if (await condition()) {
			return;
		}
		if (timeout && Date.now() - startTime > timeout) {
			throw new Error('Timeout');
		}
		await yieldExecution();
	}
}

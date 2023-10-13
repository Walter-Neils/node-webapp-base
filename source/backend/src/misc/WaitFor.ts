import yieldExecution from './yieldExecution.js';

/**
 * Waits for a condition to be true
 * @param condition The condition to wait for
 * @param timeout The maximum amount of time to wait for the condition to be true
 * @returns A promise that resolves when the condition is true
 */
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

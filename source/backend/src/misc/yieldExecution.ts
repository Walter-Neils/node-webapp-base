/**
 * Yields execution to the event loop.
 * @returns {Promise<void>}
 */
export default function yieldExecution() {
	return new Promise<void>(resolve => setImmediate(resolve));
}

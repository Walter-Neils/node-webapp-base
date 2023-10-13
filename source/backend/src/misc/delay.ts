/**
 * Returns a promise that resolves after the specified number of milliseconds
 * @param ms The number of milliseconds to wait
 * @returns A promise that resolves after the specified number of milliseconds
 */
export default function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

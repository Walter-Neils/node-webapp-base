export default function exposedPromise<T>() {
	let resolve: (value: T) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let reject: (reason?: any) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return {
		promise,
		resolve: resolve!,
		reject: reject!,
	};
}

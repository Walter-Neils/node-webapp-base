import { useEffect, useRef } from 'react';

export function useInterval(
	callback: () => void | Promise<void>,
	interval: number,
) {
	const savedCallback = useRef<() => void | Promise<void>>();

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			if (savedCallback.current) {
				savedCallback.current();
			}
		}

		if (interval !== null) {
			const id = setInterval(tick, interval);
			return () => clearInterval(id);
		}
	}, [interval]);
}

export function useTimeout(callback: () => void, timeout: number) {
	const savedCallback = useRef<() => void>();

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the timeout.
	useEffect(() => {
		function tick() {
			if (savedCallback.current) {
				savedCallback.current();
			}
		}

		if (timeout !== null) {
			const id = setTimeout(tick, timeout);
			return () => clearTimeout(id);
		}
	}, [timeout]);
}

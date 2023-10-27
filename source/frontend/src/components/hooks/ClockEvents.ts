import { useEffect, useRef } from 'react';

export function useInterval(
	callback: () => any,
	delay: number,
	references?: any[],
) {
	// Mutate the callback to include the references when they change
	const callbackRef = useRef(callback);
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback, ...(references || [])]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			if (callbackRef.current) {
				callbackRef.current();
			}
		}

		if (delay !== null) {
			const id = setInterval(tick, delay);
			return () => clearInterval(id);
		}
	}, [delay]);

	// Return the callback ref so it can be mutated
	return callbackRef;
}

export function useTimeout(
	callback: () => any,
	delay: number,
	references?: any[],
) {
	// Mutate the callback to include the references when they change
	const callbackRef = useRef(callback);
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback, ...(references || [])]);

	// Set up the timeout.
	useEffect(() => {
		function tick() {
			if (callbackRef.current) {
				callbackRef.current();
			}
		}

		if (delay !== null) {
			const id = setTimeout(tick, delay);
			return () => clearTimeout(id);
		}
	}, [delay]);

	// Return the callback ref so it can be mutated
	return callbackRef;
}

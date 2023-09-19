import { useEffect } from 'react';

export default function useEvent<T extends keyof WindowEventMap>(
	event: T,
	callback: (event: WindowEventMap[T]) => void,
	options?: boolean | AddEventListenerOptions,
) {
	useEffect(() => {
		window.addEventListener(event, callback, options);

		return () => {
			window.removeEventListener(event, callback, options);
		};
	}, [event, callback, options]);
}

import { useEffect } from 'react';

export default function useServiceWorkerCommunication<T>(
	event: string,
	callback: (event: T) => unknown,
	options?: boolean | AddEventListenerOptions,
) {
	useEffect(() => {
		const handler = (event: MessageEvent) => {
			const message = event.data;

			if (
				message.type === 'service-worker-communication' &&
				message.event === event
			) {
				const knownMessage = message as {
					messageID: string;
					type: string;
					event: string;
					payload: T;
				};

				const result = callback(knownMessage.payload);

				const response = {
					messageID: knownMessage.messageID,
					type: 'service-worker-communication-response',
					payload: result,
				};

				navigator.serviceWorker?.controller?.postMessage(response);
			}
		};

		navigator.serviceWorker?.addEventListener('message', handler);

		return () => {
			navigator.serviceWorker?.removeEventListener('message', handler);
		};
	}, [event, callback, options]);
}

import EventEmitter from 'events';
import TypedEventEmitter from './TypedEventListener.js';

type WSEvents = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[EventName: string]: any;
};

type WSEventToTypedEvent<
	TEvents extends WSEvents,
	TEventName extends keyof TEvents,
> = [data: TEvents[TEventName], eventType: TEventName];

type WSEventsToTypedEvents<TEvents extends WSEvents> = PrefixKeys<
	{
		// Remap to `message:${TEventName}` to avoid conflicts with implicit events
		[TEventName in keyof TEvents]: WSEventToTypedEvent<TEvents, TEventName>;
	},
	'message:'
> &
	WSImplicitEvents;

type PrefixKeys<TObject, TPrefix extends string> = {
	[Key in keyof TObject as `${TPrefix}${string & Key}`]: TObject[Key];
};

type WSImplicitEvents = PrefixKeys<
	{
		close: [ev: CloseEvent];
		error: [ev: Event];
		open: [ev: Event];
	},
	'ws:'
>;

/**
 * Creates a strongly typed wrapper around a WebSocket
 * @param ws The WebSocket to wrap
 */
export function TypedWebSocket<TEvents extends WSEvents>(
	ws: WebSocket | string,
) {
	if (typeof ws === 'string') {
		ws = new WebSocket(ws);
	}

	const sendMessage: <TEventName extends keyof TEvents>(
		eventName: TEventName,
		data: TEvents[TEventName],
	) => void = (eventName, data) => {
		(ws as WebSocket).send(
			JSON.stringify({
				eventName,
				data,
			}),
		);
	};
	const eventEmitter = new TypedEventEmitter<WSEventsToTypedEvents<TEvents>>(
		new EventEmitter(),
	);

	ws.addEventListener('message', event => {
		const message: {
			eventName: keyof TEvents & string;
			data: TEvents[keyof TEvents];
		} = JSON.parse(event.data.toString());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(eventEmitter as any).dispatchEvent(
			(`message:` + message.eventName) as `message:${string &
				keyof TEvents}`,
			message.data,
			message.eventName,
		);
	});

	ws.onclose = ev => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(eventEmitter as any).dispatchEvent('ws:close', ev);
	};

	ws.onerror = ev => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(eventEmitter as any).dispatchEvent('ws:error', ev);
	};

	ws.onopen = ev => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(eventEmitter as any).dispatchEvent('ws:open', ev);
	};

	return {
		sendMessage,
		eventEmitter,
	};
}

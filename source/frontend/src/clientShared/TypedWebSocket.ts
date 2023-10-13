import EventEmitter from 'events';
import TypedEventEmitter from './TypedEventListener';

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
>;

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
export function TypedWebSocket<TEvents extends WSEvents>(ws: WebSocket) {
	const sendMessage: <TEventName extends keyof TEvents>(
		eventName: TEventName,
		data: TEvents[TEventName],
	) => void = (eventName, data) => {
		ws.send(
			JSON.stringify({
				eventName,
				data,
			}),
		);
	};
	const eventEmitter = new TypedEventEmitter<
		WSEventsToTypedEvents<TEvents> & WSImplicitEvents
	>(new EventEmitter());

	ws.addEventListener('message', event => {
		const message: {
			eventName: keyof TEvents & string;
			data: TEvents[keyof TEvents];
		} = JSON.parse(event.data.toString());
		eventEmitter.dispatchEvent(
			(`message:` + message.eventName) as `message:${string &
				keyof TEvents}`,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			message.data,
			message.eventName,
		);
	});

	ws.onclose = ev => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		eventEmitter.dispatchEvent('ws:close', ev, 'close');
	};

	ws.onerror = ev => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		eventEmitter.dispatchEvent('ws:error', ev, 'error');
	};

	ws.onopen = ev => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		eventEmitter.dispatchEvent('ws:open', ev, 'open');
	};

	return {
		sendMessage,
		eventEmitter,
	};
}

import { EventEmitter } from 'events';

export type EventListenerEventMap<Keys extends string> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key in Keys]: any[];
};
export default class TypedEventEmitter<
	TypeMap extends EventListenerEventMap<string>,
> {
	private _eventEmitter: EventEmitter;
	constructor(eventEmitter: EventEmitter) {
		this._eventEmitter = eventEmitter;
	}
	addEventListener<Key extends keyof TypeMap>(
		type: Key,
		listener: (...args: TypeMap[Key]) => void,
	) {
		if (typeof type !== 'string') throw new Error('Type must be a string');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this._eventEmitter.addListener(type, listener as any);
	}
	removeEventListener<Key extends keyof TypeMap>(
		type: Key,
		listener: (...args: TypeMap[Key]) => void,
	) {
		if (typeof type !== 'string') throw new Error('Type must be a string');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this._eventEmitter.removeListener(type, listener as any);
	}
	dispatchEvent<Key extends keyof TypeMap>(
		type: Key,
		...event: TypeMap[Key]
	) {
		if (typeof type !== 'string') throw new Error('Type must be a string');
		this._eventEmitter.emit(type, event);
	}

	once<Key extends keyof TypeMap>(
		type: Key,
		listener: (event: TypeMap[Key]) => void,
	) {
		if (typeof type !== 'string') throw new Error('Type must be a string');
		this._eventEmitter.once(type, listener);
	}
}

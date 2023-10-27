import EventEmitter from 'events';
import TypedEventEmitter from '../../clientShared/TypedEventListener';
import { useEffect, useState } from 'react';

const globals: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
} = {};

const globalsEventEmitter = new TypedEventEmitter<{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	valueChanged: [key: string, value: any];
}>(new EventEmitter());

/**
 * Creates a global value that can be accessed and modified from anywhere in the application as a hook
 * @param key The name of the global value
 * @param initializer A function that returns the initial value of the global value, if it is not already set
 * @returns A tuple containing the current value of the global value and a function to set the value
 */
export function useGlobalValue<ValueType>(
	key: string,
	initializer: () => ValueType,
): [ValueType, (newValue: ValueType) => void] {
	const [value, setValue] = useState<ValueType | undefined>(
		globals[key] ?? (globals[key] = initializer()),
	);
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const listener = (changedKey: string, newValue: any) => {
			if (changedKey !== key) {
				return;
			}
			setValue(newValue);
		};
		globalsEventEmitter.addEventListener('valueChanged', listener);
		return () => {
			globalsEventEmitter.removeEventListener('valueChanged', listener);
		};
	}, []);

	return [
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value as any,
		(newValue: ValueType) => {
			globals[key] = newValue;
			globalsEventEmitter.dispatchEvent('valueChanged', key, newValue);
		},
	];
}

/**
 * Creates a global value that can be accessed and modified from anywhere in the application. This variant is for use outside of React hooks.
 * @param key The name of the global value
 * @param initializer A function that returns the initial value of the global value, if it is not already set
 * @returns A tuple containing a function to get the current value of the global value and a function to set the value
 */
export function nonHookGlobalValue<ValueType>(
	key: string,
	initializer: () => ValueType,
): [getter: () => ValueType, setter: (newValue: ValueType) => void] {
	if (!globals[key]) globals[key] = initializer();
	return [
		() => globals[key] ?? (globals[key] = initializer()),
		(newValue: ValueType) => {
			globals[key] = newValue;
			globalsEventEmitter.dispatchEvent('valueChanged', key, newValue);
		},
	];
}

import EventEmitter from 'events';
import TypedEventEmitter from '../../clientShared/TypedEventListener';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { usePromise } from '../../components/hooks/Promise';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Microservices {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MicroserviceEventEmitterDefinitions {}

const microserviceEventEmitters: Partial<{
	[TMicroserviceKey in keyof Microservices]: TypedEventEmitter<
		MicroserviceEventEmitterDefinitions[TMicroserviceKey]
	>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}> = {} as any;

export function getMicroserviceEventEmitter<
	TMicroserviceKey extends keyof Microservices,
>(microserviceKey: TMicroserviceKey) {
	let eventEmitter = microserviceEventEmitters[microserviceKey];
	if (!eventEmitter) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		eventEmitter = (microserviceEventEmitters[microserviceKey] as any) =
			new TypedEventEmitter(new EventEmitter());
	}
	return eventEmitter;
}

const microserviceProviders: Partial<{
	[TKey in keyof Microservices]: () => Microservices[TKey];
}> = {};

type MicroserviceManagerEvents = {
	[TKey in keyof Microservices as `registered:${TKey}`]: [
		loader: () => Microservices[TKey],
		key: TKey,
	];
} & {
	[TKey in keyof Microservices as `unregistered:${TKey}`]: [key: TKey];
};

export const microserviceManagerEvents =
	new TypedEventEmitter<MicroserviceManagerEvents>(new EventEmitter());

export function getMicroservice<TKey extends keyof Microservices>(key: TKey) {
	try {
		const provider = microserviceProviders[key];
		if (!provider) {
			throw new Error(`Microservice ${key} not registered`);
		}
		return provider();
	} catch (e) {
		enqueueSnackbar(`Failed to load microservice ${key}`, {
			variant: 'error',
		});
		throw e;
	}
}

export function isMicroserviceRegistered<TKey extends keyof Microservices>(
	key: TKey,
) {
	return microserviceProviders[key] !== undefined;
}

export function registerMicroservice<TKey extends keyof Microservices>(
	key: TKey,
	provider: () => Microservices[TKey],
) {
	if (microserviceProviders[key] !== undefined)
		throw new Error(`Microservice ${key} already registered`);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(microserviceProviders[key] as any) = provider;
	console.log(`Registered microservice ${key}`);
	microserviceManagerEvents.dispatchEvent(`registered:${key}`, provider, key);
}

export function unregisterMicroservice<TKey extends keyof Microservices>(
	key: TKey,
) {
	if (microserviceProviders[key] === undefined)
		throw new Error(`Microservice ${key} not registered`);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(microserviceProviders[key] as any) = undefined;
	console.log(`Unregistered microservice ${key}`);
	microserviceManagerEvents.dispatchEvent(`unregistered:${key}`, key);
}

export function useMicroservice<TKey extends keyof Microservices>(
	target: TKey,
) {
	const [service, setService] = useState(getMicroservice(target));

	useEffect(() => {
		const listener = () => {
			setService(getMicroservice(target));
		};
		microserviceManagerEvents.addEventListener(
			`registered:${target}`,
			listener,
		);
		return () => {
			microserviceManagerEvents.removeEventListener(
				`registered:${target}`,
				listener,
			);
		};
	}, []);

	return [service];
}

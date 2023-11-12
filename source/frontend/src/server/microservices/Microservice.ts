import EventEmitter from 'events';
import TypedEventEmitter from '../../clientShared/TypedEventListener';
import React, { useEffect, useState } from 'react';
import { usePromise } from '../../components/hooks/Promise';

// Interface for registering microservices. 
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Microservices { }

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MicroserviceEventEmitterDefinitions { }

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


// Gets a microservice. If you're using this in a component, use the useMicroservice hook instead.
export function getMicroservice<TKey extends keyof Microservices>(key: TKey) {
  const provider = microserviceProviders[key];
  if (!provider) {
    throw new Error(`Microservice ${key} not registered`);
  }
  return provider();
}

// Determines if a microservice is registered.
export function isMicroserviceRegistered<TKey extends keyof Microservices>(
  key: TKey,
) {
  return microserviceProviders[key] !== undefined;
}

// Registers a microservice. Should only be called once per microservice. Duplicate registrations will throw an error. 
// If for some reason you've got a really great reason to reregister a microservice, use unregisterMicroservice first. 
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

// Unregisters a microservice. Don't use unless you've got a really good reason to. 
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

// React hook for using a microservice in a component.
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

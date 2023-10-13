import { StandardResponse } from '../../clientShared/StandardResponse';
import { TypedWebSocket } from '../../clientShared/TypedWebSocket';
import { PublicUserProfile } from '../../clientShared/UserInterface';
import './Microservice';
import {
	getMicroserviceEventEmitter,
	registerMicroservice,
} from './Microservice';

declare module './Microservice' {
	interface Microservices {
		userService: {
			authenticate: (
				username: string,
				password: string,
			) => Promise<PublicUserProfile>;
		};
	}
	interface MicroserviceEventEmitterDefinitions {
		userService: {
			'auth:login': [
				user: Awaited<
					ReturnType<Microservices['userService']['authenticate']>
				>,
			];
			'auth:loginfailed': [error: string];
			'auth:logout': [];
			'service:status': ['available' | 'unavailable'];
		};
	}
}

function onlyOnce<T extends object>(fn: () => Promise<T>) {
	let state = {
		called: false,
	} as
		| {
				called: true;
				result: T;
		  }
		| {
				called: false;
		  };
	return async () => {
		if (!state.called) {
			state = {
				called: true,
				result: await fn(),
			};
		}
		return state.result;
	};
}

setTimeout(() => {
	const events = getMicroserviceEventEmitter('userService');

	registerMicroservice(
		'userService',
		onlyOnce(async () => {
			const userServiceSocket = TypedWebSocket<{
				status: 'available' | 'unavailable';
			}>(new WebSocket(`ws://${location.host}/api/userService`));

			await new Promise<void>((resolve, reject) => {
				const state = {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					cleanup: () => {},
				};

				userServiceSocket.eventEmitter.addEventListener(
					'ws:open',
					() => {
						state.cleanup();
						resolve();
					},
				);
				userServiceSocket.eventEmitter.addEventListener(
					'ws:error',
					ev => {
						state.cleanup();
						reject();
					},
				);

				state.cleanup = () => {
					userServiceSocket.eventEmitter.removeEventListener(
						'ws:open',
						state.cleanup,
					);
					userServiceSocket.eventEmitter.removeEventListener(
						'ws:error',
						state.cleanup,
					);
				};
			});

			userServiceSocket.eventEmitter.addEventListener(
				'message:status',
				status => {
					events.dispatchEvent('service:status', status);
				},
			);

			await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate network delay
			return {
				async authenticate(username, password) {
					// path: /api/user/authenticate
					// method: POST
					const response = await fetch('/api/user/authenticate', {
						method: 'POST',
						body: JSON.stringify({ username, password }),
						headers: {
							'Content-Type': 'application/json',
						},
					});
					const result: StandardResponse<PublicUserProfile> =
						await response.json();
					if (!result.success) {
						events.dispatchEvent(
							'auth:loginfailed',
							result.error.message,
						);
						throw new Error(result.error.message);
					} else {
						events.dispatchEvent('auth:login', result.content);
						return result.content;
					}
				},
				authEvents: events,
			};
		}),
	);
}, 2500);

import { enqueueSnackbar } from 'notistack';
import { StandardResponse } from '../../clientShared/StandardResponse';
import { TypedWebSocket } from '../../clientShared/TypedWebSocket';
import { PublicUserProfile } from '../../clientShared/UserInterface';
import './Microservice';
import {
	getMicroserviceEventEmitter,
	registerMicroservice,
} from './Microservice';
import { GenericNotification } from '../../clientShared/Notification';

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
			'service:notification': [notification: GenericNotification];
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

function displayNotification(notification: GenericNotification) {
	enqueueSnackbar(notification.body, {
		variant: notification.severity,
	});
}

setTimeout(() => {
	const events = getMicroserviceEventEmitter('userService');

	events.addEventListener('service:status', status => {
		console.log(`UserService status change: ${status}`);
	});

	events.addEventListener('service:notification', notification => {
		displayNotification(notification);
	});

	registerMicroservice(
		'userService',
		onlyOnce(async () => {
			const userServiceSocket = TypedWebSocket<{
				status: 'available' | 'unavailable';
				notification: GenericNotification;
			}>(
				new WebSocket(
					`ws://${location.host}:${location.port}/api/core/user`,
				),
			);

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

			userServiceSocket.eventEmitter.addEventListener(
				'message:notification',
				notification => {
					events.dispatchEvent('service:notification', notification);
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

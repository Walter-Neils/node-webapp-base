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
			return {
				async authenticate(username, password) {
					// /api/core/auth/login
					// using passport-local
					const response = await fetch('/api/core/auth/login', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ username, password }),
					});
					const json =
						(await response.json()) as StandardResponse<PublicUserProfile>;
					console.log(json);
					if (json.success) {
						return json.content;
					}
					throw new Error(json.error.message);
				},
				authEvents: events,
			};
		}),
	);
}, 500);

import { StandardResponse } from '../../clientShared/StandardResponse';
import { PublicUserProfile } from '../../clientShared/UserInterface';
import './Microservice';
import {
	getMicroserviceEventEmitter,
	registerMicroservice,
} from './Microservice';
import { GenericNotification } from '../../clientShared/Notification';
import { notificationEvents } from '../../events/NotificationEvents';

declare module './Microservice' {
	interface Microservices {
		userService: {
      // Attempt to authenticate with the given username and password. 
			authenticate: (
				username: string,
				password: string,
			) => Promise<PublicUserProfile>;
      // Fetch a user profile by username or userID
			getUserProfile: (
				filter:
					| {
							by: 'username';
							username: string;
					  }
					| {
							by: 'userID';
							userID: string;
					  },
			) => Promise<PublicUserProfile>;
      // Get the current user, or null if the user isn't logged in. 
			getCurrentUser: () => Promise<PublicUserProfile | null>;
		  // Log out the current user.	
      logOut: () => Promise<void>;
		};
	}
	interface MicroserviceEventEmitterDefinitions {
		userService: {
      // Fired when the user logs in.
			'auth:login': [
				user: Awaited<
					ReturnType<Microservices['userService']['authenticate']>
				>,
			];
      // Fired when the user fails to log in.
			'auth:loginfailed': [error: string];
      // Fired when the user logs out.
			'auth:logout': [];
      // Fired when the service status changes.
			'service:status': ['available' | 'unavailable'];
      // Fired when a notification is received. LEGACY: WILL BE MOVED TO THE NOTIFICATION SERVICE. 
			'service:notification': [notification: GenericNotification];
		};
	}
}


const events = getMicroserviceEventEmitter('userService');
if (!events) throw new Error('events is undefined');

events.addEventListener('service:status', status => {
	console.log(`UserService status change: ${status}`);
});

events.addEventListener('service:notification', notification => {
  notificationEvents.dispatchEvent('newNotification', notification);
});

registerMicroservice('userService', () => {
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

			if (response.status === 502) {
				events.dispatchEvent('auth:loginfailed', 'Service unavailable');
				throw new Error('Service unavailable');
			}

			if (response.status === 401) {
				events.dispatchEvent('auth:loginfailed', 'Invalid credentials');
				throw new Error('Invalid credentials');
			}

			if (response.status !== 200) {
				events.dispatchEvent(
					'auth:loginfailed',
					`Unknown error: ${response.status}`,
				);
				throw new Error(`Unknown error: ${response.status}`);
			}

			const json =
				(await response.json()) as StandardResponse<PublicUserProfile>;
			console.log(json);
			if (json.success) {
				events.dispatchEvent('auth:login', json.content);
				return json.content;
			}
			events.dispatchEvent('auth:loginfailed', json.error.message);
			throw new Error(json.error.message);
		},
		async getUserProfile(filter) {
			const queryParameters = new URLSearchParams();
			if (filter.by === 'username') {
				queryParameters.set('username', filter.username);
			} else if (filter.by === 'userID') {
				queryParameters.set('userID', filter.userID);
			} else {
				throw new Error('Invalid filter');
			}

			// /api/core/profile/get
			const response = await fetch(
				`/api/core/profile/get?${queryParameters.toString()}`,
			);

			if (response.status === 502) {
				throw new Error('Service unavailable');
			} else if (response.status === 404) {
				throw new Error('User not found');
			} else if (response.status === 200) {
				const json =
					(await response.json()) as StandardResponse<PublicUserProfile>;
				if (json.success) {
					return json.content;
				}
				throw new Error(json.error.message);
			} else {
				throw new Error(`Unknown error: ${response.status}`);
			}
		},
		async getCurrentUser() {
			// /api/core/auth/currentUser
			const response = await fetch('/api/core/profile/currentUser');

			if (response.status === 502) {
				throw new Error('Service unavailable');
			} else if (response.status !== 200) {
				throw new Error(`Unknown error: ${response.status}`);
			}

			const body =
				(await response.json()) as StandardResponse<PublicUserProfile>;
			if (body.success) {
				return body.content;
			}
			throw new Error(body.error.message);
		},
		async logOut() {
			// /api/core/auth/logout
			const response = await fetch('/api/core/auth/logout', {
				method: 'POST',
			});

			if (response.status === 502) {
				throw new Error('Service unavailable');
			} else if (response.status !== 200) {
				throw new Error(`Unknown error: ${response.status}`);
			}
		},
		authEvents: events,
	};
});

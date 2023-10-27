import EventEmitter from 'events';
import TypedEventEmitter from '../clientShared/TypedEventListener';
import { GenericNotification } from '../clientShared/Notification';
import { enqueueSnackbar } from 'notistack';

export const notificationEvents = new TypedEventEmitter<{
	newNotification: [notification: GenericNotification];
}>(new EventEmitter());

notificationEvents.addEventListener('newNotification', notification => {
	enqueueSnackbar(`${notification.title}: ${notification.body}`, {
		variant: notification.severity,
	});
});

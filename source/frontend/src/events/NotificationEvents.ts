import EventEmitter from 'events';
import TypedEventEmitter from '../clientShared/TypedEventListener';
import { GenericNotification } from '../clientShared/Notification';
import toast from 'react-hot-toast';

export const notificationEvents = new TypedEventEmitter<{
	newNotification: [notification: GenericNotification];
}>(new EventEmitter());

notificationEvents.addEventListener('newNotification', notification => {
  // Push notitication to toast
  toast(notification.body, {
    icon: notification.icon
  });
});

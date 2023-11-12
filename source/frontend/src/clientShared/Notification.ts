export type GenericNotification = {
  // Unique ID for the notification, if applicable. 
  notificationId?: unknown;
  // Title of the notification.
  title: string;
  // Body of the notification.
  body: string;
  // Icon to use for the notification. Should come in the form URL:<url> or ICON:<icon name>. If undefined, a default icon will be used.
  icon?: string;
  // Severity of the notification.
  severity: 'info' | 'warning' | 'error' | 'success';
  // Actions to take when the notification is clicked.
  actions?: {
    // Label for the action.
    label: string;
    // Color of the action.
    color: 'primary' | 'secondary';
    // Style of the action.
    style: 'text' | 'outlined' | 'contained';
    // Key to identify the action.
    actionKey: string;
    // Payload to pass to the action.
    actionPayload: unknown;
  }[];
}

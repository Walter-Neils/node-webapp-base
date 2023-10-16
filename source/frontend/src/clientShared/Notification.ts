export type GenericNotification = {
	notificationId: unknown;
	title: string;
	body: string;
	icon: string;
	severity: 'info' | 'warning' | 'error' | 'success';
	actions: {
		label: string;
		color: 'primary' | 'secondary';
		style: 'text' | 'outlined' | 'contained';
		actionKey: string;
		actionPayload: unknown;
	}[];
};

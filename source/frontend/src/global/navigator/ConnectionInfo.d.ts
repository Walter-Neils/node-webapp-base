declare interface Navigator {
	onLine: boolean;

	connection?: {
		downlink: number;
		metered: boolean;
		effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
		rtt: number;
		addEventListener: (type: 'change', listener: () => void) => void;
		removeEventListener: (type: 'change', listener: () => void) => void;
	};
}

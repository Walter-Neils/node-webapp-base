import { useEffect, useState } from 'react';

export function useNetworkConnection() {
	const [isOnline, setIsOnline] = useState<boolean>(true);

	const [linkInfo, setLinkInfo] = useState(
		(() => {
			if (navigator.connection) {
				return {
					state: 'available',
					downlink: navigator.connection.downlink,
					metered: navigator.connection.metered,
					effectiveType: navigator.connection.effectiveType,
					rtt: navigator.connection.rtt,
				};
			}

			return {
				state: 'unavailable',
			};
		})(),
	);

	useEffect(() => {
		if (navigator.connection) {
			const handleNetworkChange = () => {
				if (navigator.connection !== undefined) {
					setLinkInfo({
						state: 'available',
						downlink: navigator.connection.downlink,
						metered: navigator.connection.metered,
						effectiveType: navigator.connection.effectiveType,
						rtt: navigator.connection.rtt,
					});
				} else {
					setLinkInfo({
						state: 'unavailable',
					});
				}
			};

			navigator.connection.addEventListener(
				'change',
				handleNetworkChange,
			);

			return () => {
				if (navigator.connection) {
					navigator.connection.removeEventListener(
						'change',
						handleNetworkChange,
					);
				}
			};
		}
	}, []);

	useEffect(() => {
		const handleNetworkChange = () => {
			setIsOnline(navigator.onLine);
		};

		window.addEventListener('online', handleNetworkChange);
		window.addEventListener('offline', handleNetworkChange);

		return () => {
			window.removeEventListener('online', handleNetworkChange);
			window.removeEventListener('offline', handleNetworkChange);
		};
	});

	return {
		isOnline,
		linkInfo,
	};
}

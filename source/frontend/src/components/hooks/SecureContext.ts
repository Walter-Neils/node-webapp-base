import { useEffect, useState } from 'react';

export default function useIsSecureContext() {
	const [isSecureContext, setIsSecureContext] = useState(true);

	useEffect(() => {
		const handleSecureContextChange = () => {
			setIsSecureContext(window.isSecureContext);
		};

		window.addEventListener(
			'securecontextchange',
			handleSecureContextChange,
		);

		return () => {
			window.removeEventListener(
				'securecontextchange',
				handleSecureContextChange,
			);
		};
	}, []);

	return isSecureContext;
}

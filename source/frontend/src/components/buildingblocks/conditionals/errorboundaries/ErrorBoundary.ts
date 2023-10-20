import React from 'react';

export type ErrorBoundaryProps = {
	children: React.ReactNode;
	errorHandler: (
		error: Error,
		errorInfo: React.ErrorInfo,
		componentStack: string,
		reset: () => void,
	) => React.ReactNode;
};

export type ErrorBoundaryState =
	| {
			state: 'idle';
	  }
	| {
			state: 'error';
			error: Error;
			errorInfo: React.ErrorInfo;
			componentStack: string;
	  };

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { state: 'idle' };
	}

	static getDerivedStateFromError(error: Error) {
		return { state: 'error', error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({ state: 'error', error, errorInfo });
	}

	reset = () => {
		this.setState({ state: 'idle' });
	};

	render() {
		if (this.state.state === 'error') {
			return this.props.errorHandler(
				this.state.error,
				this.state.errorInfo,
				'',
				this.reset.bind(this),
			);
		}
		return this.props.children;
	}
}

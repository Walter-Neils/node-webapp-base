export type StandardResponse<T> =
	| {
			success: false;
			error: {
				message: string;
				stack?: string;
				extraData?: unknown;
			};
	  }
	| {
			success: true;
			content: T;
	  };

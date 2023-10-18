export type BasicUserProfile = {
	displayName: string;
	profilePictureURL?: string;
};

export type ClientSideDBOBject<T> = T & {
	_id: unknown;
};

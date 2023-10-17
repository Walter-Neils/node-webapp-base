export type PublicUserProfile = {
	displayName: string;
	handle: string;
	profilePictureURL: string;
};

export type PrivateUserProfile = PublicUserProfile & {
	username: string;
	email: string;
	permissions: string[];
};

export type ClientSideDBOBject<T> = T & {
	_id: unknown;
};

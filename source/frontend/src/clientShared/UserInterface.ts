export interface PublicUserProfile {
	displayName: string;
	handle: string;
	profilePictureURL: string;
}

export interface PrivateUserProfile extends PublicUserProfile {
	username: string;
	email: string;
	permissions: string[];
}

export type ClientSideDBOBject<T> = T & {
	_id: unknown;
};

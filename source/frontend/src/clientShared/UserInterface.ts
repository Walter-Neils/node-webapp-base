export interface PublicUserProfile
{
    displayName: string;
    handle: string;
    profilePictureURL: string;
}

export type ClientSideDBOBject<T> = T & {
    _id: unknown;
};
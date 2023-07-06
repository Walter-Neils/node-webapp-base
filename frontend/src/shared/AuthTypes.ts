export interface IAuthenticationRequest
{
    username: string;
    password: string;
}

export interface IAuthToken
{
    tokenID: string;
    userID: string;
    expirationDate: Date;
}
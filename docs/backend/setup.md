# Backend Setup

See the [README](../../README.md) for general setup instructions.

## Adding the first user

Adding the first user is fairly simple. The authentication controller exposes a method called `createAccount` which can be used to create a new user. It's located at `http(s?)://<HOSTNAME>:(80|443)/api/core/auth/createAccount`. To create an account, send a `POST` request with the following body:

```json
{
  "username": "some_username",
  "password": "some_password"
}
```

Assuming the request is successful, you'll receive a response with a status code of `200` and a standard formatted response where the content property contains the new user's ID. The ID is a MongoDB ObjectID. You won't need to use this ID for anything unless you're directly interacting with the database. The response will look something like this:

```json
{
  "success": true,
  "content": "653c278cda8f4b1a8c2a0b3b"
}
```

You can then log in with the credentials you just created. The authentication process is already included in the frontend, so just navigate to the frontend's login page and log in with the credentials you just created.

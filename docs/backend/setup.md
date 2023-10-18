# Backend Setup

See the [README](../../README.md) for general setup instructions.

## Adding the first user

Assuming you've decided to continue to use the default `passport.js` `local` authentication strategy, user data is stored in the Mongo cluster, specifically in a database called `users`. You'll need to create a new value in a collection called `auth`. The value should have the structure of:

```typescript
{
  username: string;
  password: string;
}
```

The `username` field is straitforward. The `password` field is the result of running the user's desired password through the salt and hashing system. At the time of writing, this is changing a decent bit, so I can't leave a surefire way of doing this. You'll need to go look at the backend service's `auth` middleware [here](../../source/backend/src/middleware/authenticationMiddleware.ts) to figure out how to do this. You shouldn't need to set up the other user data collections off the bat, as they should be created as needed. Yell at me if that's not the case.

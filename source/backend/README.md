# Backend API

## Do's and Don'ts

-   _DO NOT_ import any controller modules from any middleware modules. This may cause routes to become inaccessible or cause middleware to not be applied to certain routes.
-   _DO NOT_ use `console.log`, `console.error`, or `console.warn` in any production code. Use the `logger` module instead.

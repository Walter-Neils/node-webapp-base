# Router Container

The router container is responsible for routing requests to the correct service. It's also responsible for applying SSL encryption to requests. This means that individual services should NOT perform their own SSL encryption. As a general rule, services should be configured to listen on port 80, and almost always should not be exposed to the internet. The router container can handle nearly all types of connection proxying including HTTP, HTTPS, WebSockets, and WebRTC. If you're trying to use TCP or UDP, you're on your own, and you'll likely need to expose service ports to the internet directly.

## Configuration

### SSL Certificates

Generate a set of SSL certificates for your domain. See the [general deployment instructions](../general/Deploying.md) for information on how to do this. You'll need to then configure the router container to use these certificates.

1. Create a directory called `certs` in the `router` directory.
2. Copy your `fullchain.pem` and `privkey.pem` files into the `certs` directory.
3. Uncomment the line for copying the certificates in the `Dockerfile` in the `router` directory.
4. Uncomment the SSL configuration in the `nginx.conf` file in the `router` directory.

That's it! You should now be able to deploy the router container, and it will automatically use your SSL certificates.

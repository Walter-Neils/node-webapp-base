# Webapp Template

Walter Neils, 2024

Note: This README is currently in a state of flux as I get documentation organized. Look in the `docs` directory for content which is more likely to be up to date.

## Organization

Service source code is organized under the `source` directory. Docker files are under the `docker` directory, and further organized by service.

## Requirements

- NodeJS
- NPM
- Docker
- Docker Compose

## Installation

In each service source directory using NPM (e.g. `source/frontend`), run `npm install` to install dependencies. At the time of writing, this is required for the `frontend` and `backend` services.

## Running a Development Environment

### Setting up the environment

In the `docker/compose` directory, create a file called `.env` with the following contents:

```env
# Host configurations
MONGO_HOST=mongodb:27017
MONGO_USERNAME=admin
MONGO_PASSWORD=password
REDIS_HOST=redis

# Container Versions
FRONTEND_VERSION=latest
BACKEND_VERSION=latest
ROUTER_VERSION=latest

# Registry Location
REGISTRY="" # Blank to use local images
# REGISTRY=225807539721.dkr.ecr.us-east-1.amazonaws.com # AWS ECR Registry Example
```

#### Values to Change

If you're not hosting MongoDB and Redis in Docker, change the values of `MONGO_HOST` and `REDIS_HOST` to the appropriate values. You'll also need to change the values of `MONGO_USERNAME` and `MONGO_PASSWORD` if you're not using the default MongoDB credentials. I really shouldn't need to tell anyone that they shouldn't be using the default auth credentials in a production environment, but you never really know.

### Starting the data services

You _DO NOT_ want to start all services. Instead, start only those which you are not actively developing. Most of the time, you'll be working on the backend, and making changes to the frontend. In this case, you don't want to start either of these through Docker, but instead run them locally.

You do want to start the `mongo` and `redis` services (if you're using them). To do this, run `docker-compose up mongo redis` from the `docker/compose` directory.

See the setup instructions for other services to determine what database modifications you need to make.

### Starting the development proxy service

The application expects the backend to be available at the same host as the frontend was served from. As such, a proxy is required to 'join' the two services together. This is done through the `dev` service. _IMPORTANT_: You need to edit the `nginx.conf` file in the dev service directory so the `host` declarations point to the correct IP address. You **CANNOT** point the host values at any variant of `localhost`, as `localhost` points back at the docker container for applications running inside. In other words, you need to put in a non-loopback address (or just a nonstandard loopback address, if you maintain one) for the host targets. Navigate to the `docker/dev` directory and run `./build.sh`. This will build the dev service, which is a simple NGINX proxy. Once built, you'll want to run the `dev:latest` container and expose port 80 to some port on your host machine. For example, if you expose port 80 to port 8080, you'll be able to access the application at `http://localhost:8080`.
For example,

```bash
# In the docker/dev directory
./build.sh
docker run --name dev -p 8080:80 dev:latest
```

This will proxy requests for the frontend to `<SELF_IP>:3000` and requests for the backend to `<SELF_IP>:5000`. This command will not exit until stopped (CTRL+C), so you'll need to open a new terminal window to continue.

### Starting development services

Once you have your dev proxy service running, you'll need to start the services you're actively developing. Let's assume you're working on the frontend and backend. To start the frontend service, you'll need to navigate to `source/frontend` and run `npm run start`. This will start the frontend service on port 3000. To start the backend service, you'll need to navigate to `source/backend` and run `npm run start`. This will start the backend service on port 5000. You can now access the application at `http://localhost:8080` (if that's the port you chose when setting up the dev service). You can now make changes to the frontend and backend services and see them reflected in the application.

### Stopping the development environment

Just `CTRL+C` the dev proxy service and the services you're actively developing. Then, run `docker-compose down` from the `docker/compose` directory to stop the data services.

## Running a Production Environment

See the [deployment guide](docs/general/Deploying.md) for instructions on deploying to AWS.

## LFS (Large File Storage)

**DO NOT** store large files inside your docker images if at all possible. In the `docker/static-content` folder, there's a docker container designed to proxy requests to an AWS S3 bucket. This is the preferred method of storing large files. You'll need to edit the `nginx.conf` file in the `docker/static-content` directory to point at the correct S3 bucket. You'll also need to edit the `docker-compose.yml` file in the `docker/compose` directory to include the `static-content` service. You'll also need to edit the `docker/router` service NGINX configuration to route requests to the static content service.

## HTTPS

HTTPS is handled by the `router` service. You'll need to edit the `docker/router` service NGINX configuration to include your SSL certificates. This should be the only service exposed to the internet in a production environment. It should be the only service using SSL certificates.

## MongoDB Structure

The MongoDB database shouldn't need any special configuration. The application will create the database and collections as needed. All configuration for services should be under the `infastructure` database, with a collection per service as applicable. The schema of each collection is defined by the service which uses it.

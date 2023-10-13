# Node Webapp Base

This project is a base for a node-based web application.

## Architecture

This project is designed around the microservice architecture. By default, it comes with 3 services: the backend service, the frontend service, and the router service. The router service is the only service that is exposed to the outside world. It is responsible for routing requests to the correct service. The backend service is responsible for handling all backend logic. The frontend service is responsible for serving the result of compiling the frontend code.

## Directory Structure

- **docker**
  - **backend**
    - **Dockerfile**: The Dockerfile for the backend service.
    - **build.sh**: A script for building the backend service.
    - **metadata.sh**: A script containing metadata about the backend service. This is used to name the image after it is built.
    - **nginx.conf**: The nginx configuration file for the backend service.
  - **frontend**
    - **Dockerfile**: The Dockerfile for the frontend service.
    - **build.sh**: A script for building the frontend service.
    - **metadata.sh**: A script containing metadata about the frontend service. This is used to name the image after it is built.
    - **nginx.conf**: The nginx configuration file for the frontend service.
  - **router**
    - **Dockerfile**: The Dockerfile for the router service.
    - **build.sh**: A script for building the router service.
    - **metadata.sh**: A script containing metadata about the router service. This is used to name the image after it is built.
    - **nginx.conf**: The nginx configuration file for the router service.
  - **compose**
    - **docker-compose.yml**: The docker-compose file for the project.
    - **.env**: The environment file for the project.
- **docs**: The documentation for the project.
- **utilities**: The utilities for the project.
- **source**: The source code for the project.
  - **backend**: The source code for the backend service.
  - **frontend**: The source code for the frontend service.

## Getting Started

To get started, you will need to install [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/). You'll also need NPM and NodeJS installed on your machine. If you're on Arch Linux you can run the following script to install all of the dependencies:

```bash
sudo pacman -S docker docker-compose nodejs npm
sudo usermod -aG docker $USER
```

You might need to log out and log back in for the usermod command to take effect. You'll know you need to do this if you get a permission denied error when running docker commands.

## Building Components

You'll need to install the dependencies for each component before you can build them. To do this, run the following command in each component's directory:

```bash
npm install
```

This will install all of the dependencies for the component.

## Running in Development

All TypeScript-based projects come with a development mode. This mode will watch the source code for changes and automatically recompile the code when changes are detected. To run the project in development mode, run the following command:

```bash
npm run start
```

Note: You will need to run this command in each component's directory.

You might need to edit the router service's NGINX configuration file to point at the correct port for the service you're running in development mode. Specifically, you'll need to proxy requests to the correct port. For the UI, this is port 3000. For the backend, this is port 5000. You can find the NGINX configuration file for the router service in the docker/router directory.

## Building for Production

In the docker/compose directory, there's a `buildAll.sh` script. This script will build all of the components docker images. You can then run the project in production mode by running the following command:

```bash
docker-compose up
```

## Deploying to Production

Depends on the container registry you're using.

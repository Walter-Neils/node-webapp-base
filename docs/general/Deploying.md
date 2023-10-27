# How to deploy

## Deploying to AWS

### Requirements

Have a working AWS account with the following services:

- EC2: For hosting the application
- ECR: For hosting the Docker images

### Setting up the local environment

#### Requirements

Everything in the [README](../../README.md) applies here. You'll also need to install the AWS CLI. You can find instructions for this [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).

#### AWS Configuration

Open the `$PROJECT_ROOT/utilities/aws-configuration.sh` file. You're going to need to edit the AWS configuration values at the top of the file so they match your AWS configuration. Look at the structure of the `AWS_URL` value to figure out what information needs to go where.

### Setting up the AWS environment

#### Creating the ECR repositories

You'll need to create one ECR repository for each service. The names of these repositories should match the names of the generated Docker images. If they don't, the `docker-compose` file won't be able to find your images.

#### Creating the EC2 instance

You'll need to create an EC2 instance to host the application. The instance should be a Linux instance, and should have at least 1GB of RAM. The instance should also have a public IP address, and should be accessible from the internet. You'll need to open ports 80 and 443 to the internet so the application can be accessed.

#### Setting up the EC2 instance

Once your EC2 instance has been created, you're going to need to install Docker on it. This varies depending on the Linux distribution you're using. Once Docker is installed, you'll need to install Docker Compose. You're better off following the official instructions for this, as they're more likely to be up to date than anything I write here.

#### Generating a certificate

Follow the instructions [here](https://letsencrypt.org/getting-started/) to generate a certificate for your domain. You'll need to do this before you can set up HTTPS.

~~Note: at the time of writing this, the `router` container REQUIRES an SSL certificate. If you don't have and can't get one, you'll need to modify the `router` container to not require one.~~

### Publishing the images

#### Authenticating with the ECR

You'll need to authenticate with the ECR before you can push images to it. There's a script in the `$PROJECT_ROOT/utilities` directory called `generate-aws-auth-command.sh`. This script will generate a command that you can run to authenticate with the ECR. You'll want to execute the command that the script generates on your local machine as well as on the EC2 instance. You'll need to repeat this process periodically, as the authentication token expires after a while.

#### Publishing the images

Each service has a script called `publish.sh` in its `docker` directory. You'll need to run this script to push the image to the ECR, one service at a time. After the first publish, you'll really only be publishing one service at a time, maybe two if you're publishing the frontend and backend at the same time.

#### Preparing to pull the images to the EC2 instance

It's a good idea to create a dedicated folder on the EC2 instance to store the `docker-compose` file and the `.env` file. You'll want to copy the `.env` and `docker-compose.yml` files from `$PROJECT_ROOT/docker/compose` on your local machien to your working directory on the EC2 instance. Once you've done this, you'll want to edit the `.env` file to point the `REGISTRY` value at at the ECR registry.

#### Pulling the images to the EC2 instance

To fetch the latest images from the ECR, you'll need to run the `docker-compose pull` command from the directory containing the `docker-compose.yml` file. This will pull the latest images from the ECR.

#### Starting the application

Once you've pulled the latest images, you can start the application by running `docker-compose up -d` from the directory containing the `docker-compose.yml` file. This will start the application in the background. You can stop the application by running `docker-compose down` from the same directory.

#### Updating containers on an existing installation

If you've already installed the application, you can update the containers by running `docker-compose pull` followed by `docker-compose up -d` from the directory containing the `docker-compose.yml` file. This will pull the latest images from the ECR and start the application in the background. If you only run `docker-compose up -d`, the application will start with whatever images are currently on the EC2 instance. If you only run `docker-compose pull`, the latest images will be pulled, but the application won't be recreated with the new images. You need to run both commands to update the application.

#### Rolling back to a previous version

So you've updated something, and part of the production environment is down. Don't worry, you can roll back to a previous version. To do this, you'll need to go into your AWS ECR repository and find the images you want to roll back to. You'll need to note the image tags. Then, you'll need to edit the `.env` file on the EC2 instance so that the `SomeOffendingService_VERSION` variables point at the image tags you want to roll back to. Once you've done this, you can run `docker-compose pull` followed by `docker-compose up -d` to roll back to the previous version.

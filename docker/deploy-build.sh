#!/bin/bash

function echoerr() { echo "$@" 1>&2; }

if [ -z "$TARGET" ]; then
    TARGET="127.0.0.1"
    echoerr "No target specified, defaulting to $TARGET"
fi

if [ -z "$PUBLIC_KEY_PATH" ]; then
    PUBLIC_KEY_PATH="~/.ssh/id_rsa.pub"
    echoerr "No public key path specified, defaulting to $PUBLIC_KEY_PATH"
fi

# Read a single line of input from stdin
echoerr "Waiting for preceding pipeline step to provide docker image tag..."
DOCKER_IMAGE_TAG=$(head -n 1)
echoerr "Docker image tag: $DOCKER_IMAGE_TAG"

USERNAME=$(whoami)

rm -f ./build.tar.gz

docker save $DOCKER_IMAGE_TAG | gzip >./build.tar.gz

scp -i "$PUBLIC_KEY_PATH" ./build.tar.gz ubuntu@"$TARGET":~/build.tar.gz

# Prepare the gzipped file for docker load
ssh -i "$PUBLIC_KEY_PATH" $USERNAME@"$TARGET" "gunzip -f ~/build.tar.gz"
# Load the docker image
ssh -i "$PUBLIC_KEY_PATH" $USERNAME@"$TARGET" "docker load -i ~/build.tar"
# Delete the gzipped file
ssh -i "$PUBLIC_KEY_PATH" $USERNAME@"$TARGET" "rm -f ~/build.tar"
# Stop the currently running vineheart-dashboard container and delete it
ssh -i "$PUBLIC_KEY_PATH" $USERNAME@"$TARGET" "docker stop vineheart-dashboard && docker rm vineheart-dashboard"
# Run the new vineheart-dashboard container
ssh -i "$PUBLIC_KEY_PATH" $USERNAME@"$TARGET" "docker run -d --restart=always -p 5000:5000 --hostname production --name vineheart-dashboard $DOCKER_IMAGE_TAG"

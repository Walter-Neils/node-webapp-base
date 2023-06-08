#!/bin/bash

source ./metadata.sh

# If the PROJECT_NAME variable is not set, exit
if [ -z "$PROJECT_NAME" ]; then
    echo "PROJECT_NAME variable is not set"
    exit 1
fi

function echoerr() { echo "$@" 1>&2; }
function silent_exec() { "$@" >/dev/null 2>&1; }

MONGODB_CONTAINER_NAME="$PROJECT_NAME-mongodb"

# Check if the mongodb container is already running
if [ "$(docker ps -q -f name=$MONGODB_CONTAINER_NAME)" ]; then
    echoerr "MongoDB container is already running"
    exit 0
fi

# Check if the mongodb container exists
if [ "$(docker ps -aq -f name=$MONGODB_CONTAINER_NAME)" ]; then
    echoerr "MongoDB container exists but is not running"
    echoerr "Starting MongoDB container..."
    docker start $MONGODB_CONTAINER_NAME
    exit 0
fi

echoerr "Creating MongoDB container..."
silent_exec docker run -d --restart=always -p 27017:27017 --name $MONGODB_CONTAINER_NAME mongo:latest

echoerr "MongoDB container created"

echo $MONGODB_CONTAINER_NAME

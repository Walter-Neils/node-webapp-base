#!/bin/bash

source ./metadata.sh # Loads the IMAGE_NAME variable

BACKEND_ROOT_DIR=$(pwd)/../../source/backend

DOCKER_BUILD_DIR=$(pwd)

# Check if the 'nginx' command is available on the system
IS_NGINX_AVAILABLE=$(command -v nginx)

# If it's available, use it to check the nginx.conf file
if [ ! -z "$IS_NGINX_AVAILABLE" ]; then
    NGINX_CHECK_RESULT=$(nginx -t -c $DOCKER_BUILD_DIR/nginx.conf 2>&1)
    
    # Look for 'syntax is ok' in the output
    if [[ $NGINX_CHECK_RESULT != *"syntax is ok"* ]]; then
        echo "nginx.conf is invalid"
        exit 1
    else
        echo "nginx.conf is valid"
    fi
fi

cd $BACKEND_ROOT_DIR

npm run build

if [ $? -ne 0 ]; then
    echo "Failed to build backend"
    exit 1
fi

cd $DOCKER_BUILD_DIR

rm -rf ./build

mkdir -p ./build
mkdir -p ./build/node_modules
cp -r $BACKEND_ROOT_DIR/build/* ./build
cp -r $BACKEND_ROOT_DIR/package.json ./build

docker build -t $IMAGE_NAME:latest .
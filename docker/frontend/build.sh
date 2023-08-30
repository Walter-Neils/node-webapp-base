#!/bin/bash

source ./metadata.sh # Loads the IMAGE_NAME variable

# If it doesn't exist, create the 'static' directory
if [ ! -d "static" ]; then
    mkdir static
fi

BUILDER_DIR=$(pwd)
FRONTEND_DIR=$BUILDER_DIR/../../source/frontend

cd $FRONTEND_DIR

# If node_modules doesn't exist, run npm install
if [ ! -d "node_modules" ]; then
    npm install
fi

# If build doesn't exist, run npm run build
if [ ! -d "build" ]; then
    npm run build
    # If the build fails, exit the script
    if [ $? -ne 0 ]; then
        exit 1
    fi
fi

# Remove the files in $BUILDER_DIR/static
rm -rf $BUILDER_DIR/static/*

# Copy the files from $FRONTEND_DIR/build to $BUILDER_DIR/static
cp -r $FRONTEND_DIR/build/* $BUILDER_DIR/static

# Remove the files in $FRONTEND_DIR/build
rm -rf $FRONTEND_DIR/build

cd $BUILDER_DIR

# Build the docker image
docker build -t $IMAGE_NAME:latest .

# Remove the files in $BUILDER_DIR/static
rm -rf $BUILDER_DIR/static/
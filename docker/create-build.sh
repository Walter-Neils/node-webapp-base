#!/bin/bash

function echoerr() { echo "$@" 1>&2; }
function silent_exec() { "$@" >/dev/null 2>&1; }
function all_to_stderr() { "$@" 1>&2; }

BUILD_DIR="./build"
REACT_APP_ROOT="../frontend"
SERVER_ROOT="../server"
PROJECT_ROOT=".."
DOCKER_ROOT="."

# Convert relative paths to absolute
BUILD_DIR=$(
    cd "$(dirname "$BUILD_DIR")"
    pwd
)/$(basename "$BUILD_DIR")
REACT_APP_ROOT=$(
    cd "$(dirname "$REACT_APP_ROOT")"
    pwd
)/$(basename "$REACT_APP_ROOT")
SERVER_ROOT=$(
    cd "$(dirname "$SERVER_ROOT")"
    pwd
)/$(basename "$SERVER_ROOT")
PROJECT_ROOT=$(
    cd "$(dirname "$PROJECT_ROOT")"
    pwd
)/$(basename "$PROJECT_ROOT")
DOCKER_ROOT=$(
    cd "$(dirname "$DOCKER_ROOT")"
    pwd
)/$(basename "$DOCKER_ROOT")

echoerr "BUILD_DIR: $BUILD_DIR"
echoerr "REACT_APP_ROOT: $REACT_APP_ROOT"
echoerr "SERVER_ROOT: $SERVER_ROOT"
echoerr "PROJECT_ROOT: $PROJECT_ROOT"
echoerr "DOCKER_ROOT: $DOCKER_ROOT"

rm -rf $BUILD_DIR
echoerr "Rebuilding application..."
cd $REACT_APP_ROOT
rm -rf ./build
silent_exec npm install
silent_exec npm run build
cd $SERVER_ROOT
silent_exec npm install

cd $DOCKER_ROOT
mkdir $BUILD_DIR
mkdir ./build/frontend
cp -r ../frontend/build ./build/frontend/build
cp -r $SERVER_ROOT $BUILD_DIR/server

# Get current git commit short hash
GIT_COMMIT=$(git rev-parse --short HEAD) 2>/dev/null
# If the git command failed, use the current timestamp
if [ $? -ne 0 ]; then
    GIT_COMMIT=$(date +%s)
fi
source ./metadata.sh
DOCKER_IMAGE_NAME="$PROJECT_NAME"
DOCKER_IMAGE_VERSION_TAG="$GIT_COMMIT"

all_to_stderr docker build -t $DOCKER_IMAGE_NAME:latest -t $DOCKER_IMAGE_NAME:$DOCKER_IMAGE_VERSION_TAG .

echo $DOCKER_IMAGE_NAME:$DOCKER_IMAGE_VERSION_TAG

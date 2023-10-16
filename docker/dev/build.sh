#!/bin/bash

source ./metadata.sh # Loads the IMAGE_NAME variable

# Build the image
docker build -t $IMAGE_NAME:latest .
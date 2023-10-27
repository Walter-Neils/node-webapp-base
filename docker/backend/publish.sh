#!/bin/bash

source ./metadata.sh # Sets the TARGET_IMAGE_NAME variable

CONTAINER_IMAGE_NAME=$TARGET_IMAGE_NAME:latest

# Make sure the image actually exists
docker image inspect $CONTAINER_IMAGE_NAME > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Image $CONTAINER_IMAGE_NAME does not exist. Please build it first."
    exit 1
fi

source ../../utilities/aws-configuration.sh # Sets the AWS_URL variable

if [ -z "$AWS_URL" ]; then
    echo "AWS_URL is not set. Please set it in utilities/aws-configuration.sh"
    exit 1
fi

# Push the image to AWS
docker tag $CONTAINER_IMAGE_NAME $AWS_URL/$CONTAINER_IMAGE_NAME
docker push $AWS_URL/$CONTAINER_IMAGE_NAME
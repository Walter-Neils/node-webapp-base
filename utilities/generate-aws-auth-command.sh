#!/bin/bash

source ./aws-configuration.sh

LOGIN_TOKEN=$(aws ecr get-login-password --region $AWS_REGION)

echo "echo \"$LOGIN_TOKEN\" | docker login --username AWS --password-stdin $AWS_URL"
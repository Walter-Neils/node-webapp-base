#!/bin/bash

AWS_REGION="us-east-1"
AWS_HOST_KEY="225807539721"
AWS_PRODUCT="dkr.ecr"
AWS_URL="$AWS_HOST_KEY.$AWS_PRODUCT.$AWS_REGION.amazonaws.com"

LOGIN_TOKEN=$(aws ecr get-login-password --region $AWS_REGION)

echo "echo \"$LOGIN_TOKEN\" | docker login --username AWS --password-stdin $AWS_URL"
#!/bin/bash


# This script sets up the AWS configuration variables. 
# To use it in another script, source it like so:
# source aws-configuration.sh

AWS_REGION="us-east-1"
AWS_HOST_KEY="225807539721"
AWS_PRODUCT="dkr.ecr"


# Everything below should be left alone
AWS_URL="$AWS_HOST_KEY.$AWS_PRODUCT.$AWS_REGION.amazonaws.com"

#!/bin/bash

cd /data/node

NODE_CMD="node entryPoint.js"

NGINX_COMMAND="nginx"

# Run both in parallel. If one fails, terminate the other and exit with an error code
$NODE_CMD &
NODE_PID=$!
$NGINX_COMMAND &
NGINX_PID=$!

wait $NODE_PID $NGINX_PID

# If either of the processes exited with a non-zero exit code, exit with an error code
if [ $? -ne 0 ]; then
    exit 1
fi

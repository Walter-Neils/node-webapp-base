#!/bin/bash

SCRIPT_DIR=$(pwd)

cd ..

declare -a targets=("backend" "frontend")

# For each value in the array, run build.sh
for i in "${targets[@]}"; do
    cd $i
    ./build.sh
    cd $SCRIPT_DIR/..
done

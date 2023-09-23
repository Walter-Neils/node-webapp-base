#!/bin/bash

CURRENT_DIR=$PWD

cd $CURRENT_DIR/../source/backend
npm run --silent depcruise > $CURRENT_DIR/metagraph.dot

cd $CURRENT_DIR/../source/frontend
npm run --silent depcruise >> $CURRENT_DIR/metagraph.dot

cd $CURRENT_DIR

gvpack -u metagraph.dot > metagraph.gv

rm metagraph.dot

mkdir -p $CURRENT_DIR/../docs/images

dot -Tpng metagraph.gv > $CURRENT_DIR/../docs/images/metagraph.png
dot -Tsvg metagraph.gv > $CURRENT_DIR/../docs/images/metagraph.svg

rm metagraph.gv
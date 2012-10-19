#!/bin/bash

SOURCE=$(cd `dirname $0`; pwd)

# target location
TARGET=$1

if [ x$TARGET = x ]; then

cat <<EOF
Must supply target folder parameter, e.g.:

  deploy.sh ../deploy/lib/g11n
EOF
else
	pushd $SOURCE/source
	DATA=`find . -name *data -o -name *formats -type d`
	popd
    for f in $DATA; 
    	do mkdir -p $TARGET/source/$f/; 
    	cp -r $SOURCE/source/$f/ $TARGET/source/$f; 
    done
fi
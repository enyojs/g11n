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
    for f in `find . -name *data -o -name *formats -type d`; 
    	do mkdir -p $TARGET/source/$f/; 
    	cp -r $f/ $TARGET/source/$f; 
    done
	popd
fi
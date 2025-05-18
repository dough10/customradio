#!/bin/bash

set -e

npm run test

VERSION=$(jq -r '.version' package.json)

if [ $? -ne 0 ] || [ -z "$VERSION" ]; then
  echo "Error: Unable to read version from package.json"
  exit 1
fi

docker build -t "$1:$VERSION" -t "$1:latest" .
docker push "$1:$VERSION" && docker push "$1:latest"
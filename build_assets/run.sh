#!/bin/bash

source .env

secret=$(openssl rand -base64 16 | tr -d '/+' | cut -c1-16)

docker run \
  --name=testradio \
  --env=REDIS_URL="$REDIS_URL" \
  --env=REDIS_PASSWORD="$REDIS_PASSWORD" \
  --env=SESSION_SECRET="$secret" \
  --env=LOG_LEVEL="$LOG_LEVEL" \
  --env "$BLACKLIST" \
  --env=NODE_ENV=production \
  --env=TZ=America/Chicago \
  --volume=/Users/dough10/Documents/customradio/data:/usr/src/app/data \
  --workdir=/usr/src/app \
  -p 3000:3000 \
  --restart=always \
  --runtime=runc -d registry.dough10.me/customradio:latest
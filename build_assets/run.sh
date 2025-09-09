#!/bin/bash

source .env

generate_secret() {
  openssl rand -base64 32 | tr -d '/+' | cut -c1-32
}

jwt_secret=$(generate_secret)
session_secret=$(generate_secret)
cookie_secret=$(generate_secret)

docker run \
  --name=testradio \
  --env=REDIS_URL="$REDIS_URL" \
  --env=REDIS_PASSWORD="$REDIS_PASSWORD" \
  --env=WORKOS_API_KEY="$WORKOS_API_KEY" \
  --env=WORKOS_CLIENT_ID="$WORKOS_CLIENT_ID" \
  --env=COOKIE_SECRET="$cookie_secret" \
  --env=JWT_SECRET="$jwt_secret" \
  --env=SESSION_SECRET="$session_secret" \
  --env=LOG_LEVEL="$LOG_LEVEL" \
  --env=AUTH_SERVER_URL="$AUTH_SERVER_URL" \
  --env=BLACKLIST="$BLACKLIST" \
  --env=NODE_ENV=production \
  --env=TZ=America/Chicago \
  --volume=/Users/dough10/Documents/customradio/data:/usr/src/app/data \
  --volume=/Users/dough10/Documents/customradio/logs:/usr/src/app/logs \
  --workdir=/usr/src/app \
  -p 3000:3000 \
  --restart=always \
  --runtime=runc -d registry.dough10.me/customradio:latest
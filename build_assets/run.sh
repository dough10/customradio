#!/bin/bash
set -euo pipefail

if [ ! -f .env ]; then
  echo ".env file missing"
  exit 1
fi

set -o allexport
source .env
set +o allexport

generate_secret() {
  openssl rand -hex 32
}

jwt_secret=$(generate_secret)
session_secret=$(generate_secret)
cookie_secret=$(generate_secret)

docker run \
  --name=testradio \
  --env-file=.env \
  --env=COOKIE_SECRET="$cookie_secret" \
  --env=JWT_SECRET="$jwt_secret" \
  --env=SESSION_SECRET="$session_secret" \
  --env=NODE_ENV=production \
  --env=TZ=America/Chicago \
  --volume=/Users/dough10/Documents/customradio/data:/usr/src/app/data \
  --volume=/Users/dough10/Documents/customradio/logs:/usr/src/app/logs \
  --workdir=/usr/src/app \
  -p 3000:3000 \
  --restart=always \
  --runtime=runc -d registry.dough10.me/customradio:latest
FROM node:lts-slim AS build

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node . .

RUN npm install && npm run build

FROM node:lts-slim

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init sqlite3 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV TZ="America/Chicago"

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node --from=build /usr/src/app/index.js ./
COPY --chown=node:node --from=build /usr/src/app/test.js ./
COPY --chown=node:node --from=build /usr/src/app/public ./public
COPY --chown=node:node --from=build /usr/src/app/util ./util
COPY --chown=node:node --from=build /usr/src/app/routes ./routes
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/templates ./templates
COPY --chown=node:node --from=build /usr/src/app/logs ./logs
COPY --chown=node:node --from=build /usr/src/app/data ./data
COPY --chown=node:node --from=build /usr/src/app/model ./model
COPY --chown=node:node --from=build /usr/src/app/locales ./locales
EXPOSE 3000/tcp

CMD ["dumb-init", "node", "--expose-gc", "index.js"]

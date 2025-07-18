FROM node:lts-slim AS base

ENV TZ="America/Chicago"
WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssl \
        dumb-init \
        sqlite3 && \
    rm -rf /var/lib/apt/lists/*

FROM base AS build

COPY --chown=node:node . .
RUN npm install && npm run build

FROM base

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/public ./public
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/templates ./templates
COPY --chown=node:node --from=build /usr/src/app/logs ./logs
COPY --chown=node:node --from=build /usr/src/app/data ./data
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

EXPOSE 3000/tcp

CMD ["dumb-init", "node", "--expose-gc", "dist/index.js"]

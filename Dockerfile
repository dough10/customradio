FROM node:lts-slim AS build

WORKDIR /usr/radiotxt

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node . .

RUN npm install && npm run runtime && npm run build

FROM node:lts-slim

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init sqlite3 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV TZ="America/Chicago"

WORKDIR /usr/radiotxt

COPY --chown=node:node --from=build /usr/radiotxt/package*.json ./
COPY --chown=node:node --from=build /usr/radiotxt/changelog.json ./
COPY --chown=node:node --from=build /usr/radiotxt/public ./public
COPY --chown=node:node --from=build /usr/radiotxt/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/radiotxt/templates ./templates
COPY --chown=node:node --from=build /usr/radiotxt/logs ./logs
COPY --chown=node:node --from=build /usr/radiotxt/data ./data
COPY --chown=node:node --from=build /usr/radiotxt/dist ./dist

EXPOSE 3000/tcp

CMD ["dumb-init", "node", "--expose-gc", "dist/index.js"]

FROM node:20-bullseye-slim AS base

ENV TZ="America/Chicago"
WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openssl \
        dumb-init \
        sqlite3 \
        build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY . .
RUN npm ci && npm run build

FROM base
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --build-from-source

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/templates ./templates
COPY --from=build /usr/src/app/data ./data
COPY --from=build /usr/src/app/logs ./logs

EXPOSE 3000
CMD ["dumb-init", "node", "--expose-gc", "dist/index.js"]
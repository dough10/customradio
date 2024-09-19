FROM node:lts-slim AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY --chown=node:node . .
RUN npm run build

FROM node:lts-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

ENV NODE_ENV production
ENV TZ="America/Chicago"

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/index.js ./
COPY --from=build /usr/src/app/html ./html
COPY --from=build /usr/src/app/util ./util
COPY --from=build /usr/src/app/routes ./routes
COPY --from=build /usr/src/app/node_modules ./node_modules

EXPOSE 3000/tcp

CMD ["dumb-init", "node", "index.js"]

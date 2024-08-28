FROM node:22 AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/index.js ./
COPY --from=build /usr/src/app/html ./html
COPY --from=build /usr/src/app/util ./util
COPY --from=build /usr/src/app/routes ./routes
COPY --from=build /usr/src/app/node_modules ./node_modules

ENV TZ="America/Chicago"

EXPOSE 3000/tcp

CMD ["node", "index.js"]

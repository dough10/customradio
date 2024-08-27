FROM node:20

WORKDIR /usr/src/app

COPY . .

ENV TZ="America/Chicago"

RUN date
RUN npm install
RUN npm run build

EXPOSE 3000/tcp

CMD ["node", "index.js"]
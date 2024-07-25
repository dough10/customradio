FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

ENV TZ="America/Chicago"

RUN date
RUN npm install
RUN apt-get update
RUN apt-get install nano -y

COPY . .

EXPOSE 3000/tcp

CMD ["node", "index.js" ]
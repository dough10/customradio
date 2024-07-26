FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

ENV TZ="America/Chicago"

RUN date
RUN npm install
RUN apt-get update
RUN apt-get install nano -y
RUN npx webpack

EXPOSE 3000/tcp

CMD ["node", "index.js" ]
FROM node:9-alpine

WORKDIR /app

RUN apk update && \
  apk upgrade && \
  apk add postgresql && \
  rm -rf /var/cache/apk/*

COPY package.json .
RUN yarn install --quiet

COPY . .

CMD yarn start

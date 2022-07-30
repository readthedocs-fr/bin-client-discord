FROM node:17-alpine3.14

WORKDIR /rtb-bot
COPY . .
RUN yarn install; yarn build

ENTRYPOINT yarn start

FROM node:17-alpine3.14

ENTRYPOINT yarn start
WORKDIR /usr/local/lib/rtb-bot
LABEL org.opencontainers.image.source https://github.com/readthedocs-fr/bin-client-discord

COPY . /usr/local/lib/rtb-bot
RUN yarn install; yarn build

FROM alpine
EXPOSE 80

RUN apk update && apk upgrade

# install node and yarn
RUN apk add nodejs-current
RUN apk add yarn

# Timezone tool
RUN apk add tzdata
ENV TZ=America/Toronto
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir /lib/lifx_remote
WORKDIR /lib/lifx_remote

COPY ./package.json ./package.json
RUN yarn

COPY . .

CMD ["node", "/lib/lifx_remote/server.js"]
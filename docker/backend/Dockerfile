FROM alpine

# Install nginx, nodejs and npm
RUN apk add --update nginx nodejs npm && rm -rf /var/cache/apk/*

# Set the 'NODE_ENV' environment variable to 'production'
ENV NODE_ENV production

RUN mkdir /data && mkdir /data/nginx && mkdir /data/nginx/cache
RUN mkdir /data/node

# Copy configuration file from the current directory
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy ./build folder from the current directory to /data/node
COPY ./build /data/node
COPY ./containerCommand.sh /data/node

WORKDIR /data/node

RUN npm install

EXPOSE 80

CMD ["sh", "/data/node/containerCommand.sh"]
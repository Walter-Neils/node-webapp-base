FROM nginx

RUN mkdir /data && mkdir /data/nginx && mkdir /data/nginx/cache

# Copy configuration file from the current directory
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy the static files from the current directory
COPY ./static /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
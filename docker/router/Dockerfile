FROM nginx

# Copy ./nginx.conf from the current directory to /etc/nginx/nginx.conf
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy the certs from the current directory to /etc/nginx/certs
# COPY ./certs /etc/nginx/certs

CMD ["nginx", "-g", "daemon off;"]
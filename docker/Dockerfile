FROM archlinux/archlinux:base-devel

RUN pacman -Syy --needed --noconfirm git npm

# Copy the build directory from the host
COPY ./build /build

RUN cd /build/server && npm install

# Expose port 5000
EXPOSE 5000

# Run the server
CMD cd /build/server && npm run start
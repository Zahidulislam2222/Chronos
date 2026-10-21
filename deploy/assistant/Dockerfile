ARG NODE_IMAGE
FROM ${NODE_IMAGE}
ARG CRYPTO_VERSION
ARG SSL_VERSION
ARG ZLIB_VERSION
RUN apk add --no-cache --upgrade "libcrypto3=${CRYPTO_VERSION}" "libssl3=${SSL_VERSION}" "zlib=${ZLIB_VERSION}" \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
       /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
USER 1000:1000
HEALTHCHECK CMD ["node", "/app/scripts/assistant/healthcheck.mjs"]
LABEL org.opencontainers.image.title="Chronos guide runtime" \
      org.opencontainers.image.source="https://github.com/Zahidulislam2222/Chronos"

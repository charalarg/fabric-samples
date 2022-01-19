FROM node:12.15
WORKDIR /usr/src/app
COPY --chown=node:node . /usr/src/app
RUN npm ci --only=production
ENV TINI_VERSION v0.19.0

ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
COPY docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
RUN chmod +x /usr/src/app/docker-entrypoint.sh
ENV PORT 9999
EXPOSE 9999
ENV NODE_ENV=production
USER node
ENTRYPOINT ["/tini", "--", "/usr/src/app/docker-entrypoint.sh"]

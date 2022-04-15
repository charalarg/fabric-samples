FROM node:14-alpine3.14
ENV NODE_ENV production
WORKDIR /app

COPY --chown=node:node . /app

EXPOSE 4200
USER root

USER node
ENTRYPOINT ["npm", "run"]
CMD ["start-no-host-check"]

FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node apps/web/package*.json ./apps/web/
COPY --chown=node:node packages/character-rules ./packages/character-rules

WORKDIR /app/apps/web
RUN npm ci

COPY --chown=node:node apps/web .

EXPOSE 5173

CMD ["npm", "run", "dev"]

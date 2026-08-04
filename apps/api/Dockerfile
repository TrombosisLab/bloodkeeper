FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node apps/api/package*.json ./apps/api/
COPY --chown=node:node packages/character-rules ./packages/character-rules

WORKDIR /app/apps/api
RUN npm ci

COPY --chown=node:node apps/api/prisma ./prisma
RUN npx prisma generate

COPY --chown=node:node apps/api .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

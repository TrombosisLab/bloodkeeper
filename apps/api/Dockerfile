FROM node:22-alpine

WORKDIR /app

COPY apps/api/package*.json ./apps/api/
COPY packages/character-rules ./packages/character-rules

WORKDIR /app/apps/api
RUN npm ci

COPY apps/api/prisma ./prisma

RUN npx prisma generate

COPY apps/api .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

FROM node:22-alpine

WORKDIR /app

COPY apps/web/package.json ./apps/web/
COPY packages/character-rules ./packages/character-rules

WORKDIR /app/apps/web
RUN npm install

COPY apps/web .

EXPOSE 5173

CMD ["npm", "run", "dev"]

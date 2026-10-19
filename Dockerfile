FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY server ./server

EXPOSE 10000
USER node
CMD ["node", "--import", "tsx", "server/index.ts"]

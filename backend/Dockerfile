FROM node:20-alpine

# Dependencias nativas para compilar better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install


COPY . .

# Garante que os diretorios de dados existam e pertencam ao user node
RUN mkdir -p data uploads \
    && chown -R node:node data uploads

# Usuario nao-root (seguranca)
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]

# === Etapa 1: Build ===
FROM node:20-alpine AS build
WORKDIR /app

# API_BASE_URL injetada em build-time (Vite substitui no bundle)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# === Etapa 2: Servir com nginx ===
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

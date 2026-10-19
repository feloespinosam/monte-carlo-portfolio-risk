# Etapa 1: Construcción (Build)
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias e instalarlas
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar el código fuente y construir la aplicación
COPY . .
RUN npm run build

# Etapa 2: Servidor web de producción (Nginx)
FROM nginx:alpine

# Copiar los archivos estáticos generados por Vite a Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

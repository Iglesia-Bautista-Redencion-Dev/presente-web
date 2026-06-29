# =====================================================================
# ETAPA 1: COMPILACIÓN DEL FRONTEND (Node.js & Vite)
# =====================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build-app

# Copiar archivos de dependencias e instalar de forma completa
COPY package*.json ./
RUN npm install

# Asegurar los procesadores de estilos
RUN npm install postcss tailwindcss autoprefixer

# Copiar el código fuente completo
COPY . .

# Compilar de forma limpia
# Eliminamos el flag --force que causaba el error de sintaxis en Vite
RUN ./node_modules/.bin/vite build

# =====================================================================
# ETAPA 2: IMAGEN FINAL DE PRODUCCIÓN (PocketBase Servidor)
# =====================================================================
FROM alpine:latest

RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /app

# Instalar PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.14/pocketbase_0.22.14_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && rm /tmp/pb.zip

# Estructurar directorio público
RUN mkdir -p /app/pb_public

# Copiar el resultado de la compilación de la ETAPA 1
COPY --from=frontend-builder /build-app/dist* /app/pb_public/
COPY --from=frontend-builder /build-app/build* /app/pb_public/

# Copiar las migraciones si existen en el repositorio
COPY ./pb_migrations ./pb_migrations

EXPOSE 3000

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:3000", "--dir=/app/pb_data", "--migrationsDir=/app/pb_migrations"]

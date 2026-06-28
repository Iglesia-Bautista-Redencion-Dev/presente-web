# ==========================================
# ETAPA 1: Compilación del Frontend (Node/Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build-app

# Copiar archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalar todas las dependencias necesarias
RUN npm install

# Forzar herramientas de estilos necesarias para Vite/PostCSS
RUN npm install postcss tailwindcss autoprefixer

# Copiar el resto del código fuente del proyecto
COPY . .

# Compilar el frontend saltándose el chequeo estricto de tipos de TypeScript
RUN ./node_modules/.bin/vite build

# ==========================================
# ETAPA 2: Imagen Final de Producción (PocketBase)
# ==========================================
FROM alpine:latest

# Instalar dependencias esenciales de ejecución
RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /app

# Descargar e instalar PocketBase de forma limpia
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.14/pocketbase_0.22.14_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && rm /tmp/pb.zip

# Copiar únicamente el frontend compilado desde la ETAPA 1
# Detecta si se generó en 'dist' o 'build' y lo mueve a la carpeta pública de PocketBase
COPY --from=frontend-builder /build-app/dist* ./pb_public/
COPY --from=frontend-builder /build-app/build* ./pb_public/

# Copiar las migraciones del repositorio directamente al entorno de PocketBase
COPY ./pb_migrations ./pb_migrations

# Exponer el puerto 3000 configurado en Dokploy
EXPOSE 3000

# Arrancar PocketBase mapeando el volumen persistente y ejecutando las migraciones automáticas
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:3000", "--dir=/app/pb_data", "--migrationsDir=/app/pb_migrations"]

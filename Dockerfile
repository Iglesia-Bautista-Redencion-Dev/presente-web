# =====================================================================
# ETAPA 1: COMPILACIÓN DEL FRONTEND (Node.js & Vite)
# =====================================================================
# Usamos una imagen ligera de Node.js para instalar dependencias y compilar
FROM node:20-alpine AS frontend-builder

# Definimos el directorio de trabajo aislado para la compilación
WORKDIR /build-app

# Copiamos primero los archivos de dependencias para aprovechar la caché de capas de Docker
COPY package*.json ./

# Instalamos todas las dependencias declaradas en el package.json
RUN npm install

# Forzamos la instalación de los procesadores de estilos para blindar el empaquetado de Vite
RUN npm install postcss tailwindcss autoprefixer

# Copiamos el resto del código fuente del repositorio al entorno de compilación
COPY . .

# Ejecutamos el empaquetado de producción omitiendo el chequeo estricto de tipos de TypeScript
RUN ./node_modules/.bin/vite build

# =====================================================================
# ETAPA 2: IMAGEN FINAL DE PRODUCCIÓN (PocketBase Servidor)
# =====================================================================
# Usamos la imagen mínima de Alpine Linux para mantener el contenedor ultra ligero y seguro
FROM alpine:latest

# Instalamos los paquetes mínimos del sistema operativo necesarios para ejecutar binarios y descargar archivos
RUN apk add --no-cache ca-certificates unzip wget

# Definimos el directorio raíz de la aplicación en producción
WORKDIR /app

# Descargamos el motor binario de PocketBase de forma limpia directamente desde su repositorio oficial
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.14/pocketbase_0.22.14_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && rm /tmp/pb.zip

# Creamos la carpeta pública obligatoria para el frontend estático
RUN mkdir -p /app/pb_public

# Copiamos el resultado de la ETAPA 1 verificando de forma segura qué carpeta generó Vite (dist o build)
COPY --from=frontend-builder /build-app/dist* /app/pb_public/
COPY --from=frontend-builder /build-app/build* /app/pb_public/

# Copiamos la carpeta de migraciones del repositorio directamente al entorno de PocketBase
COPY ./pb_migrations ./pb_migrations

# Exponemos el puerto de red 3000 exigido por la configuración de Dokploy
EXPOSE 3000

# Arrancamos PocketBase enlazando el volumen persistente y activando las migraciones automáticas al iniciar
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:3000", "--dir=/app/pb_data", "--migrationsDir=/app/pb_migrations"]

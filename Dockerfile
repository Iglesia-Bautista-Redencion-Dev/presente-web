
FROM alpine:latest

# 1. Instalar dependencias esenciales del sistema operativo
RUN apk add --no-cache ca-certificates unzip wget nodejs npm

# 2. Establecer el directorio de trabajo
WORKDIR /app

# 3. Descargar e instalar PocketBase (Asegura la versión estable)
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.14/pocketbase_0.22.14_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && rm /tmp/pb.zip

# 4. Copiar todo el código del repositorio al contenedor
COPY . .

# 5. Compilar el frontend (Vite) para generar los archivos estáticos
# Esto instalará tus dependencias de Node y creará la carpeta dist/ build
RUN npm install
RUN ./node_modules/.bin/tsc && ./node_modules/.bin/vite build


# 6. Mover el resultado de la compilación a la carpeta pública de PocketBase
# PocketBase lee automáticamente 'pb_public' para servir el frontend en la raíz
RUN mkdir -p pb_public && cp -r dist/* pb_public/

# 7. Exponer el puerto 3000 que configuramos en Dokploy
EXPOSE 3000

# 8. Arrancar PocketBase aplicando automáticamente tus migraciones al iniciar
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:3000", "--dir=/app/pb_data", "--migrationsDir=/app/migraciones pb"]

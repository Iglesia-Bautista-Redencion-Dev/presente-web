FROM alpine:latest

# 1. Instalar dependencias esenciales del sistema operativo
RUN apk add --no-cache ca-certificates unzip wget nodejs npm

# 2. Establecer el directorio de trabajo principal
WORKDIR /app

# 3. Descargar e instalar PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.14/pocketbase_0.22.14_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && rm /tmp/pb.zip

# 4. Copiar los archivos de dependencias primero (optimiza la caché de Docker)
COPY package*.json ./

# 5. Instalar todas las dependencias del proyecto
RUN npm install

# 6. Forzar la instalación de herramientas de estilos globales para evitar fallos de PostCSS
RUN npm install postcss tailwindcss autoprefixer

# 7. Copiar el resto del código fuente del repositorio
COPY . .

# 8. Compilar el frontend saltándose el chequeo estricto de tipos de TypeScript
RUN ./node_modules/.bin/vite build

# 9. Asegurar la creación de pb_public y copiar el contenido empaquetado de forma segura
RUN mkdir -p /app/pb_public && \
    if [ -d "dist" ]; then cp -r dist/* /app/pb_public/; \
    elif [ -d "build" ]; then cp -r build/* /app/pb_public/; \
    else echo "No se encontró carpeta de compilación" && exit 1; fi

# 10. Exponer el puerto 3000 requerido por Dokploy
EXPOSE 3000

# 11. Arrancar PocketBase con volumen persistente y migración automática
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:3000", "--dir=/app/pb_data", "--migrationsDir=/app/pb_migrations"]

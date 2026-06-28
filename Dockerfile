FROM alpine:latest

# 1. Instalar dependencias esenciales del sistema operativo
RUN apk add --no-cache ca-certificates unzip wget nodejs npm

# 2. Establecer el directorio de trabajo
WORKDIR /app

# 3. Descargar e instalar PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.14/pocketbase_0.22.14_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && rm /tmp/pb.zip

# 4. Copiar todo el código de tu repositorio
COPY . .

# 5. Instalar todas las dependencias del package.json
RUN npm install

# 6. Forzar la instalación/actualización de postcss para evitar el error de 'config'
RUN npm install postcss tailwindcss autoprefixer

# 7. Compilar usando los ejecutables locales de node_modules
RUN ./node_modules/.bin/tsc && ./node_modules/.bin/vite build

# 8. Mover el frontend compilado a la carpeta pública de PocketBase
RUN mkdir -p pb_public && cp -r dist/* pb_public/

# 9. Exponer el puerto 3000 de Dokploy
EXPOSE 3000

# 10. Arrancar PocketBase con la ruta de tus migraciones
CMD /app/pocketbase serve --http=0.0.0.0:3000 --dir=/app/pb_data --migrationsDir="/app/migraciones pb"

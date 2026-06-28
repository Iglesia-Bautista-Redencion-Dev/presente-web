FROM alpine:latest

RUN apk add --no-cache unzip ca-certificates

# Descargar el motor de PocketBase para Linux
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.23.0/pocketbase_0.23.0_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Copiar tu web terminada y tus migraciones al servidor
COPY ./pb_public /pb/pb_public

EXPOSE 8080

# Iniciar el servidor cuando arranque
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
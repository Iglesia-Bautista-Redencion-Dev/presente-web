# =====================================================================
# ETAPA 1: COMPILACIÓN DEL FRONTEND (Node.js & Vite)
# =====================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build-app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# =====================================================================
# ETAPA 2: IMAGEN FINAL DE PRODUCCIÓN (PocketBase)
# =====================================================================
FROM alpine:3.20

RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /app

ADD https://github.com/pocketbase/pocketbase/releases/download/v0.22.14/pocketbase_0.22.14_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && rm /tmp/pb.zip

RUN mkdir -p /app/pb_public

COPY --from=frontend-builder /build-app/dist /app/pb_public/

COPY ./pb_migrations /app/pb_migrations

EXPOSE 3000

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:3000", "--dir=/app/pb_data", "--migrationsDir=/app/pb_migrations"]

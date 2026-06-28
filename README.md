# Presente Web App

Sistema web responsivo para control de asistencia — IBR Redención Bautista.

## Requisitos
- Node.js 18+
- PocketBase corriendo (mismo que antes)

## Instalación

```bash
# 1. Entrar a la carpeta
cd presente-web

# 2. Instalar dependencias
npm install

# 3. Configurar URL de PocketBase
# Edita: src/services/pocketbase.js — línea 5
# Cambia PB_URL por la URL de tu Cloudflare Tunnel o localhost

# 4. Iniciar en desarrollo
npm run dev
```

La app abre en: **http://localhost:5173**

## Tres terminales (igual que antes)

| Terminal | Comando |
|----------|---------|
| 1 | `./servidor/pocketbase/pocketbase serve` |
| 2 | `cloudflared tunnel --url http://localhost:8090` |
| 3 | `npm run dev` (dentro de presente-web/) |

## Para producción

```bash
npm run build
# Genera carpeta dist/ — sirve con cualquier servidor estático
# O usa: npm run preview (para probar el build)
```

## Estructura de pantallas

```
/login              → Login con cédula + PIN

/lider              → Inicio del líder
/lider/asistencia   → Tomar asistencia del día
/lider/estudiantes  → Ver/agregar/editar estudiantes

/admin              → Dashboard del admin
/admin/grupos       → CRUD de grupos
/admin/lideres      → CRUD de líderes
/admin/estudiantes  → Ver todos, mover entre grupos
/admin/stats        → Estadísticas por período
```

## Configuración PocketBase

La colección `usuarios` necesita estos campos:
- `cedula` (text)
- `pin` (text)
- `nombre` (text)
- `rol` (text: "admin" | "lider")
- `rol_iglesia` (text)
- `grupo` (relation → grupos)
- `activo` (bool)

## Acceso desde celulares

Mientras uses Cloudflare Tunnel, todos en la red pueden acceder via:
`https://tu-url.trycloudflare.com` (para PocketBase API)

Para la web app, en desarrollo: comparte `http://TU-IP-LOCAL:5173`
En producción: haz build y sírvelo con PocketBase o Nginx.

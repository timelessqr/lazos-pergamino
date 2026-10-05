# 📜 Lazos Pergamino

Backend de pergaminos digitales para funerarias. Cada funeraria registrada obtiene **4 salas fijas**, y cada sala tiene **1 QR permanente**, **1 pergamino editable** y **1 libro de condolencias**.

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env

# 3. MongoDB en Docker (puerto 27018)
npm run db:up

# 4. Datos de demostración (imprime un token de prueba)
npm run seed:demo

# 5. Arrancar
npm run dev
```

La API queda en `http://localhost:3000`. La documentación viva está en `GET /api`.

## ⚠️ Autenticación

**No hay. Todas las rutas están abiertas.** El mecanismo está pendiente de definir. **No desplegar así a producción.**

Los guards (`src/middleware/auth.js`, `src/middleware/ownership.js`) y el módulo `usuarios/` siguen en el repo sin usarse, listos para reconectar. Ver [CLAUDE.md §5](CLAUDE.md).

## Probar el flujo

```bash
# Sin token: las rutas están abiertas
curl -s localhost:3000/api/funerarias | jq

# Escanear el QR de una sala
curl -s localhost:3000/api/pergamino/<CODIGO_QR> | jq

# Dejar una condolencia
curl -s -X POST localhost:3000/api/pergamino/<CODIGO_QR>/condolencias \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"María","mensaje":"Mi más sentido pésame."}' | jq
```

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con recarga automática |
| `npm run dev:full` | Levanta Mongo y arranca el servidor |
| `npm run db:up` / `db:down` | Inicia / detiene MongoDB |
| `npm run db:reset` | Borra el volumen y recrea la base |
| `npm run db:ui` | mongo-express en `localhost:8081` |
| `npm run db:shell` | Consola `mongosh` del contenedor |
| `npm run seed:demo` | Datos de demostración |
| `npm run check:db` | Estado de las colecciones |
| `npm run clear:db` | Vacía las colecciones |

## Pruebas

Endpoints `/api/test/*` para probar a mano (no se montan en producción):

```bash
curl -s -X POST http://localhost:3000/api/test/escenario | jq   # escenario completo
curl -s http://localhost:3000/api/test/integridad | jq          # verifica las reglas del dominio
curl -s http://localhost:3000/api/test | jq                     # índice
```

Todos los curl de la API están en [src/modules/test/TEST_ENDPOINTS.md](src/modules/test/TEST_ENDPOINTS.md).

## Arquitectura

Clean architecture por módulo, cuatro capas: `routes → controllers → services → repositories → models`.

Módulos: `usuarios`, `admin`, `funerarias`, `salas`, `pergaminos`, `qr`, `condolencias`, `media`, `dashboard`.

Ver [CLAUDE.md](CLAUDE.md) para el detalle de arquitectura, colecciones de MongoDB, convenciones y trampas conocidas.

## Almacenamiento

`STORAGE_DRIVER=local` guarda en `uploads/`. Con `STORAGE_DRIVER=r2` usa Cloudflare R2 (rellena las variables `R2_*`). El código de la aplicación no cambia: `storageService` resuelve el driver.

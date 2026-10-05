# Test Endpoints — Pruebas manuales

Base URL local: `http://localhost:3000`

> ⚠️ Estos endpoints **no se montan cuando `NODE_ENV=production`** (guarda en `src/routes/index.js`).
>
> ⚠️ **Toda la API está abierta**: la autenticación está pendiente de definir.

Requisitos: `npm run db:up` y `npm run dev` corriendo.

---

## Inicio rápido

```bash
# 1. Crear un escenario completo (funeraria + 4 salas + pergamino publicado + condolencia)
curl -s -X POST http://localhost:3000/api/test/escenario | jq

# 2. Ver que las reglas del dominio se cumplen
curl -s http://localhost:3000/api/test/integridad | jq

# 3. Listar los QR generados con su URL pública
curl -s http://localhost:3000/api/test/qr | jq
```

Índice de todos los endpoints:
```bash
curl -s http://localhost:3000/api/test | jq
```

---

## Estado del sistema

### Conexión, colecciones y storage
```bash
curl -s http://localhost:3000/api/test/estado | jq
```
Respuesta esperada:
```json
{
  "data": {
    "database": { "estado": "conectado", "nombre": "lazos_pergamino" },
    "colecciones": { "users": 1, "funerarias": 1, "salas": 4, "qrs": 4,
                     "pergaminos": 4, "condolencias": 1, "media": 0 },
    "storage": { "driver": "local" },
    "reglas": { "salasPorFuneraria": 4, "qrsPorSala": 1 }
  }
}
```

### Verificar las invariantes del dominio
Comprueba, para toda la base: 4 salas por funeraria, 1 QR y 1 pergamino por sala, punteros correctos y códigos QR sin duplicados.
```bash
curl -s http://localhost:3000/api/test/integridad | jq
```
```json
{ "message": "✅ Todas las reglas del dominio se cumplen",
  "data": { "ok": true, "funerariasRevisadas": 2, "problemas": [] } }
```
Si `ok: false`, cada problema trae `tipo` (`salas_incompletas`, `sala_sin_qr`, `sala_sin_pergamino`, `qr_desvinculado`, `qr_duplicado`) y su detalle.

---

## Datos de prueba

### Crear un escenario completo
Crea (o reutiliza) el superadmin, registra una funeraria con sus 4 salas, publica el pergamino de la Sala 1 con los datos del diseño real y deja una condolencia. Devuelve además un token listo para usar.
```bash
curl -s -X POST http://localhost:3000/api/test/escenario | jq
```
Con nombre propio:
```bash
curl -s -X POST http://localhost:3000/api/test/escenario \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Funeraria Test Rancagua"}' | jq
```
La respuesta trae `salaPublicada.qrCode` y `siguientePaso` con el curl exacto para escanearlo.

### Rellenar y publicar el pergamino de una sala
```bash
curl -s -X POST http://localhost:3000/api/test/salas/<SALA_ID>/llenar \
  -H "Content-Type: application/json" \
  -d '{"publicar": true}' | jq
```
Con `{"publicar": false}` lo deja en borrador (útil para comprobar que el escaneo devuelve 404).

### Limpiar los datos de prueba
Borra en cascada las funerarias cuyo nombre empieza por `Funeraria Test` y todo lo que cuelga de ellas.
```bash
curl -s -X DELETE http://localhost:3000/api/test/limpiar | jq
```

---

## Inspección

### Volcar una colección
Colecciones: `users`, `funerarias`, `salas`, `qrs`, `pergaminos`, `condolencias`, `media`.
```bash
curl -s "http://localhost:3000/api/test/coleccion/salas?limit=5" | jq
curl -s "http://localhost:3000/api/test/coleccion/pergaminos?limit=1" | jq '.data.documentos[0].servicios'
```

### Trazar el árbol completo de una funeraria
```bash
FID=$(curl -s "http://localhost:3000/api/test/coleccion/funerarias?limit=1" | jq -r '.data.documentos[0]._id')
curl -s "http://localhost:3000/api/test/funerarias/$FID/trazar" | jq
```
```
FUN-001 Funeraria Lazos de Vida
  Sala 1: QR Z5ZK9KR4VN | publicado | Raúl Esteban Martínez González | condolencias: 1
  Sala 2: QR 3N4HB48FCL | borrador  | Sin asignar                    | condolencias: 0
  Sala 3: QR NFUCJBWHCZ | borrador  | Sin asignar                    | condolencias: 0
  Sala 4: QR LDBRPYCWXY | borrador  | Sin asignar                    | condolencias: 0
```

### Listar todos los QR
```bash
curl -s http://localhost:3000/api/test/qr | jq
```

### Simular un escaneo
Registra el escaneo y devuelve el pergamino, igual que la ruta pública.
```bash
curl -s http://localhost:3000/api/test/escanear/<CODIGO_QR> | jq
```

---

## CRUD completo — flujo real de la API

Todo lo de abajo usa los endpoints **de producción**, no los de test.

### Paso 1 — Sin token

⚠️ **Las rutas están abiertas**: la autenticación está pendiente de definir. Ningún curl de esta guía necesita cabecera `Authorization`.

```bash
curl -s http://localhost:3000/api/funerarias | jq
```

### Paso 2 — Crear funeraria (crea sus 4 salas, QR y pergaminos)
```bash
curl -s -X POST http://localhost:3000/api/funerarias \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Funeraria Lazos de Vida",
    "telefono": "+56 9 1234 5678",
    "email": "contacto@lazosdevida.cl",
    "direccion": "Av. Los Carrera 1234",
    "ciudad": "Rancagua",
    "branding": { "colorPrimario": "#8C7B5A", "tipografia": "serif" }
  }' | jq
```

### Paso 3 — Listar y leer
```bash
# Listar (paginado + búsqueda)
curl -s "http://localhost:3000/api/funerarias?page=1&limit=20&search=Lazos" | jq

FID=$(curl -s http://localhost:3000/api/funerarias \
  | jq -r '.data.funerarias[0].id')

# Con sus 4 salas, QR y pergaminos resueltos
curl -s "http://localhost:3000/api/funerarias/$FID/completa" | jq

# Estadísticas y búsqueda
curl -s http://localhost:3000/api/funerarias/stats | jq
curl -s "http://localhost:3000/api/funerarias/search?q=Rancagua" | jq
```

### Paso 4 — Actualizar y borrar
```bash
curl -s -X PUT "http://localhost:3000/api/funerarias/$FID" -H "Content-Type: application/json" \
  -d '{"telefono": "+56 9 9999 9999", "ciudad": "Santiago"}' | jq

# Soft delete (conserva salas, QR y pergaminos)
curl -s -X DELETE "http://localhost:3000/api/funerarias/$FID" | jq
```

### Paso 5 — Salas
```bash
# Las 4 salas de la funeraria
curl -s "http://localhost:3000/api/funerarias/$FID/salas" | jq

# Una sala por su número (1..4)
curl -s "http://localhost:3000/api/funerarias/$FID/salas/numero/1" | jq

SID=$(curl -s "http://localhost:3000/api/funerarias/$FID/salas" | jq -r '.[0].id // .data[0].id')

# Renombrar la sala
curl -s -X PUT "http://localhost:3000/api/salas/$SID" -H "Content-Type: application/json" \
  -d '{"nombre": "Sala San Francisco", "capacidad": 120, "ubicacion": "Primer piso"}' | jq
```

### Paso 6 — Editar el pergamino
```bash
PID=$(curl -s "http://localhost:3000/api/pergaminos/sala/$SID" | jq -r '.data.id')

# Contenido completo (los datos del diseño real)
curl -s -X PUT "http://localhost:3000/api/pergaminos/$PID" -H "Content-Type: application/json" \
  -d '{
    "difunto": {
      "nombre": "Raúl Esteban",
      "apellido": "Martínez González",
      "fechaNacimiento": "1948-04-10",
      "fechaFallecimiento": "2024-05-15",
      "fechasTexto": "10 ABRIL 1948  -  15 MAYO 2024",
      "fotoMarco": "ovalo"
    },
    "frase": "Tu amor y tu ejemplo vivirán por siempre en nuestros corazones.",
    "servicios": [
      { "tipo": "velatorio", "titulo": "VELATORIO", "icono": "calendario",
        "fechaTexto": "Jueves 16 de mayo de 2024", "horaTexto": "15:00 a 22:00 hrs.",
        "lugar": "Salón Lazos de Vida", "direccion": "Av. Los Carrera 1234, Rancagua", "orden": 0 },
      { "tipo": "ceremonia_religiosa", "titulo": "CEREMONIA RELIGIOSA", "icono": "iglesia",
        "fechaTexto": "Viernes 17 de mayo de 2024", "horaTexto": "11:00 hrs.",
        "lugar": "Parroquia San Francisco", "direccion": "Estado 567, Rancagua", "orden": 1 },
      { "tipo": "sepultura", "titulo": "DESPEDIDA Y SEPULTURA", "icono": "hoja",
        "fechaTexto": "Viernes 17 de mayo de 2024", "horaTexto": "12:30 hrs.",
        "lugar": "Cementerio Parque Jardines de la Paz", "direccion": "Ruta 5 Sur Km. 96, Rancagua", "orden": 2 }
    ]
  }' | jq

# Catálogo del editor: plantillas, tipos de servicio, iconos
curl -s http://localhost:3000/api/pergaminos/opciones | jq
```

### Paso 7 — CRUD de los bloques de servicio
```bash
# Agregar un bloque
curl -s -X POST "http://localhost:3000/api/pergaminos/$PID/servicios" -H "Content-Type: application/json" \
  -d '{"tipo":"misa","titulo":"MISA DE RÉQUIEM","icono":"cruz",
       "fechaTexto":"Sábado 18 de mayo","horaTexto":"10:00 hrs.",
       "lugar":"Catedral de Rancagua"}' | jq

SVID=$(curl -s "http://localhost:3000/api/pergaminos/$PID" | jq -r '.data.servicios[-1]._id')

# Editar
curl -s -X PUT "http://localhost:3000/api/pergaminos/$PID/servicios/$SVID" -H "Content-Type: application/json" \
  -d '{"horaTexto": "11:30 hrs."}' | jq

# Reordenar (array de IDs en el nuevo orden)
curl -s -X PUT "http://localhost:3000/api/pergaminos/$PID/servicios/reorder" -H "Content-Type: application/json" \
  -d "{\"orden\": [\"$SVID\"]}" | jq

# Eliminar
curl -s -X DELETE "http://localhost:3000/api/pergaminos/$PID/servicios/$SVID" | jq
```

### Paso 8 — Ciclo de vida del pergamino
```bash
curl -s -X PUT "http://localhost:3000/api/pergaminos/$PID/publicar" | jq
curl -s -X PUT "http://localhost:3000/api/pergaminos/$PID/archivar" | jq

# Reiniciar para el siguiente servicio — el QR NO cambia
curl -s -X POST "http://localhost:3000/api/pergaminos/$PID/reiniciar" | jq
```

### Paso 9 — QR
```bash
# Los 4 QR de la funeraria
curl -s "http://localhost:3000/api/qr/funeraria/$FID" | jq

QID=$(curl -s "http://localhost:3000/api/qr/funeraria/$FID" | jq -r '.data[0].id')

# Descargar el PNG 512×512 listo para imprimir
curl -s "http://localhost:3000/api/qr/$QID/imagen" -o qr.png
file qr.png     # → PNG image data, 512 x 512

# Con colores propios
curl -s "http://localhost:3000/api/qr/$QID/imagen?dark=%238C7B5A&light=%23FBF7EE" -o qr-color.png

# Data URL para previsualizar en el panel
curl -s "http://localhost:3000/api/qr/$QID/dataurl" | jq -r '.data.dataUrl' | head -c 80

# Estadísticas de escaneo / activar-desactivar
curl -s "http://localhost:3000/api/qr/$QID/stats" | jq
curl -s -X PUT "http://localhost:3000/api/qr/$QID/estado" -H "Content-Type: application/json" \
  -d '{"isActive": false}' | jq
```

### Paso 10 — Vista pública (sin token)
```bash
CODE=$(curl -s "http://localhost:3000/api/qr/funeraria/$FID" | jq -r '.data[0].code')

# El pergamino tal como lo ve quien escanea
curl -s "http://localhost:3000/api/pergamino/$CODE" | jq
```
```json
{ "data": {
    "difunto": { "nombreCompleto": "Raúl Esteban Martínez González",
                 "fechasTexto": "10 ABRIL 1948  -  15 MAYO 2024" },
    "frase": "Tu amor y tu ejemplo vivirán por siempre en nuestros corazones.",
    "servicios": [ { "icono": "calendario", "titulo": "VELATORIO", "…": "…" } ],
    "funeraria": { "nombre": "Funeraria Lazos de Vida" },
    "sala": { "numero": 1, "libroCondolencias": { "habilitado": true } } } }
```

> Un pergamino en `borrador` devuelve **404**. Publícalo antes de probar.

### Paso 11 — Libro de condolencias
```bash
# Configuración del libro (público)
curl -s "http://localhost:3000/api/pergamino/$CODE/condolencias/config" | jq

# Dejar un mensaje (público)
curl -s -X POST "http://localhost:3000/api/pergamino/$CODE/condolencias" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"María Pérez","relacion":"Amiga de la familia",
       "mensaje":"Mi más sentido pésame para toda la familia."}' | jq

# Leer los mensajes publicados (público)
curl -s "http://localhost:3000/api/pergamino/$CODE/condolencias?page=1&limit=20" | jq

# Exigir código de acceso
curl -s -X PUT "http://localhost:3000/api/salas/$SID/libro-condolencias" -H "Content-Type: application/json" \
  -d '{"requiereCodigo": true, "requiereModeracion": true}' | jq

# Generar el código y validarlo
ACC=$(curl -s -X POST "http://localhost:3000/api/salas/$SID/libro-condolencias/codigo" | jq -r '.data.codigoAcceso')

curl -s -X POST "http://localhost:3000/api/pergamino/$CODE/condolencias/validar-codigo" \
  -H "Content-Type: application/json" -d "{\"codigo\": \"$ACC\"}" | jq

# Moderación (admin)
curl -s "http://localhost:3000/api/condolencias/sala/$SID?estado=pendiente" | jq
curl -s "http://localhost:3000/api/condolencias/sala/$SID/stats" | jq
curl -s "http://localhost:3000/api/condolencias/sala/$SID/search?q=pésame" | jq

CID=$(curl -s "http://localhost:3000/api/condolencias/sala/$SID" | jq -r '.data.condolencias[0]._id')
curl -s -X PUT "http://localhost:3000/api/condolencias/$CID/moderar" -H "Content-Type: application/json" \
  -d '{"estado": "aprobada"}' | jq
curl -s -X DELETE "http://localhost:3000/api/condolencias/$CID" | jq
```

### Paso 12 — Media (fotos del pergamino)
```bash
curl -s -X POST "http://localhost:3000/api/media/upload/$SID" \
  -F "archivo=@/ruta/a/retrato.jpg" \
  -F "seccion=retrato" \
  -F "titulo=Retrato" | jq

curl -s "http://localhost:3000/api/media/sala/$SID" | jq
curl -s "http://localhost:3000/api/media/stats/$SID" | jq
curl -s http://localhost:3000/api/media/storage/info | jq
```

### Paso 13 — Dashboard y admin
```bash
curl -s http://localhost:3000/api/dashboard | jq
curl -s http://localhost:3000/api/dashboard/global | jq
curl -s "http://localhost:3000/api/dashboard/funeraria/$FID" | jq

# Alta completa: funeraria + 4 salas + 4 QR + 4 pergaminos + usuario
curl -s -X POST http://localhost:3000/api/admin/register-complete -H "Content-Type: application/json" \
  -d '{
    "funeraria": { "nombre": "Funeraria del Valle", "telefono": "+56 9 8888 7777", "ciudad": "Curicó" },
    "usuario":   { "coreUserId": "operador-valle", "nombre": "Operador Valle", "email": "valle@test.cl" }
  }' | jq

# Generar los 4 PNG de golpe
curl -s -X POST "http://localhost:3000/api/admin/funerarias/$FID/qr/generar" | jq

curl -s http://localhost:3000/api/admin/metrics | jq
curl -s http://localhost:3000/api/admin/health | jq
curl -s "http://localhost:3000/api/admin/search?q=Lazos" | jq
```

---

## Comprobaciones de seguridad

⚠️ **No aplican hoy**: las rutas están abiertas, todo responde 200 sin credenciales.

Cuando se reconecte la autenticación, hay que verificar:

- Sin credenciales → 401
- Credenciales de la funeraria B pidiendo recursos de A → 403, incluyendo `/salas/:id`, `/pergaminos/:id` y `/qr/:id`, que se identifican por su propio id y necesitan `requireOwnership`
- Un usuario de funeraria llamando a `/api/admin/*` → 403
- `GET /api/pergamino/:code` y el libro de condolencias → deben seguir **abiertos** (quien escanea el QR no tiene cuenta)

```bash
# Los endpoints de test no existen en producción → 404
NODE_ENV=production PORT=3001 node server.js &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/test
```

## Errores frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `404` al escanear un QR válido | El pergamino está en `borrador` | `PUT /api/pergaminos/:id/publicar` |
| `429 Too Many Requests` | Rate limiter | Espera la ventana |
| `Esta sala ya tiene un pergamino asignado` | `salaId` es único en `pergaminos` | Es intencional: 1 pergamino por sala |
| `MongoServerError: not authorized` | Falta el rol en el usuario de Mongo | `npm run db:reset` recrea el usuario |
| `ECONNREFUSED 127.0.0.1:27018` | Mongo no está levantado | `npm run db:up` |
| El QR cambió tras reiniciar | **Bug** — el código es inmutable | Ver la invariante en `CLAUDE.md` §1 |

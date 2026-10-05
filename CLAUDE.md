# CLAUDE.md — Lazos Pergamino

Contexto para agentes y desarrolladores que trabajen en este repositorio.

---

## 1. Qué es este proyecto

Backend de **pergaminos digitales para funerarias**.

Una funeraria se registra en la plataforma y el sistema le crea automáticamente **4 salas fijas**. Cada sala tiene:

| Recurso | Cantidad | Mutable |
|---|---|---|
| **QR** | 1 por sala | ❌ Nunca cambia — se imprime una sola vez y se cuelga en la sala |
| **Pergamino** | 1 por sala | ✅ Editable por la funeraria en cada servicio |
| **Libro de condolencias** | 1 por sala | ✅ Configurable, recibe mensajes del público |

El **pergamino** es una esquela digital: nombre del difunto, retrato ovalado, fechas, frase, e **"INFORMACIÓN DEL SERVICIO"** (velatorio / ceremonia religiosa / sepultura, cada uno con icono, fecha, hora, lugar y dirección) y pie con el logo de la funeraria.

### Flujo de negocio

1. El superadmin registra la funeraria → el sistema crea 4 salas + 4 QR + 4 pergaminos en blanco
2. La funeraria imprime los 4 QR y los coloca físicamente en cada sala
3. Llega un servicio → la funeraria edita el pergamino **de esa sala**
4. Publica el pergamino (`estado: publicado`)
5. Los visitantes escanean el QR de la sala y ven el pergamino
6. Dejan mensajes en el libro de condolencias de esa sala
7. Termina el velatorio → la funeraria **reinicia** el pergamino. **El QR no cambia.**

> ⚠️ **Invariante central:** el código QR es inmutable. Nunca se regenera al reiniciar, archivar o editar un pergamino. Si un cambio rompe esto, es un bug.

---

## 2. Stack

- **Node.js** + **Express 4** (CommonJS, `type: "commonjs"`)
- **MongoDB 7** vía **Mongoose 8** — corre en Docker (`docker-compose.yml`)
- **JWT** (`jsonwebtoken`) — presente en el repo pero **sin uso**: la autenticación está pendiente de definir
- **Joi** para validación
- **qrcode** + **sharp** para generar los PNG de los QR
- **multer** (memoria) + storage intercambiable: disco local o **Cloudflare R2** (S3 SDK)
- **Jest** + **supertest** para tests

---

## 3. Arquitectura

Clean architecture **por módulo**, 4 capas. Cada módulo vive en `src/modules/<nombre>/` con exactamente esta forma:

```
src/modules/<modulo>/
├── routes/        ← define endpoints, aplica middlewares (auth, validación)
├── controllers/   ← lee req, llama al service, responde con responseHelper
├── services/      ← TODA la lógica de negocio y las reglas del dominio
└── repositories/  ← único lugar que habla con Mongoose
```

### Regla de dependencias (no la rompas)

```
routes → controllers → services → repositories → models
```

- Un **controller nunca** toca un modelo de Mongoose directamente.
- Un **repository nunca** contiene reglas de negocio (ni valida, ni decide).
- Un **service** puede llamar a repositories de otros módulos y a otros services (así `funerariaService` aprovisiona salas, QR y pergaminos).
- Los **models** viven en `src/models/`, compartidos, no dentro de los módulos.

### Estructura completa

```
lazos-pergamino/
├── server.js                    # arranque de Express, CORS, helmet, rate limit
├── docker-compose.yml           # MongoDB 7 + mongo-express (perfil "tools")
├── docker/mongo-init.js         # crea usuario de app y colecciones base
├── seed-demo.js                 # datos de demo listos para probar
├── check-database.js            # estado de colecciones + verifica 4 salas/funeraria
├── clear-database.js            # vacía las colecciones (no en producción)
└── src/
    ├── config/
    │   ├── database.js          # conexión Mongoose con reintentos
    │   └── environment.js       # variables tipadas + validateEnvironment()
    ├── middleware/
    │   ├── auth.js              # (sin uso) guards de autenticación y scope
    │   ├── ownership.js         # (sin uso) requireOwnership: aislamiento por recurso
    │   ├── validation.js        # validate(schema), validateObjectId, validatePagination
    │   ├── upload.js            # multer en memoria, solo imágenes
    │   └── rateLimiter.js       # general, auth, condolencias, público
    ├── models/                  # UsuarioFuneraria, Funeraria, Sala, QR, Pergamino, Condolencia, Media
    ├── modules/                 # auth, admin, funerarias, salas, pergaminos,
    │                            # qr, condolencias, media, dashboard
    ├── routes/index.js          # monta todos los módulos + documentación viva en GET /api
    ├── services/storage/        # storageService → local | r2 (intercambiable)
    └── utils/
        ├── constants.js         # reglas de negocio, límites, mensajes
        ├── validators.js        # todos los esquemas Joi
        ├── responseHelper.js    # formato único de respuesta
        ├── codeGenerator.js     # códigos de QR y de acceso al libro
        └── qrImageGenerator.js  # PNG / dataURL de los QR
```

---

## 4. Colecciones de MongoDB

Siete colecciones. `usuariofunerarias` es un mapeo de identidad contra core-qr, no una tabla de credenciales. Las relaciones son por `ObjectId` (referencias, no subdocumentos), salvo `servicios` y `secciones`, que van embebidos en `pergaminos` porque siempre se leen junto al pergamino.

```
usuariofunerarias ► funerarias ─┬──► salas ─┬──► qrs          (1:1 con sala)
  (funerariaId)                 │           ├──► pergaminos   (1:1 con sala)
                               │            ├──► condolencias (1:N)
                               │            └──► media        (1:N)
                               └──► (todas llevan funerariaId para consultas directas)
```

### `usuariofunerarias`
⚠️ **Actualmente sin uso** (no hay autenticación, ver §5). Mapeo de identidad, no tabla de credenciales: qué usuario externo tiene acceso y con qué rol. Sin contraseñas.
```js
{ coreUserId (único),          // el `userId` que core-qr firma en su token
  nombre, email,               // copia informativa; la fuente es core-qr
  rol: 'superadmin' | 'funeraria',
  funerariaId: ObjectId|null,  // null para superadmin
  isActive, ultimoAcceso }
```

### `funerarias`
```js
{ codigo: 'FUN-001' (único, autogenerado), nombre, razonSocial, ruc,
  telefono, email, direccion, ciudad, pais, sitioWeb,
  branding: { logoUrl, colorPrimario, colorSecundario, tipografia },
  totalSalas: 4, activo, creadoPor: ObjectId }
```

### `salas`
Índice único `{ funerariaId, numero }` — una funeraria no repite número de sala.
```js
{ funerariaId, numero: 1..4, nombre, descripcion, capacidad, ubicacion,
  qrId: ObjectId,          // su QR fijo
  pergaminoId: ObjectId,   // su pergamino editable
  libroCondolencias: { habilitado, requiereCodigo, codigoAcceso,
                       requiereModeracion, mensajeBienvenida, totalMensajes },
  activa }
```

### `qrs`
`code` y `salaId` son ambos únicos → **1 QR por sala, para siempre**.
```js
{ code: 'Z5ZK9KR4VN' (único, inmutable), url, tipo: 'sala',
  funerariaId, salaId (único), imagenUrl,
  estadisticas: { vistas, escaneos, ultimaVisita,
                  visitasUnicas: [{ ip, timestamp, userAgent }] },  // máx 100
  isActive, creadoPor }
```

### `pergaminos`
`salaId` único → 1:1 con la sala. Refleja el diseño físico del pergamino.
```js
{ funerariaId, salaId (único), template: 'clasico'|'moderno'|'elegante'|'sobrio',
  encabezado: { titulo: 'EN MEMORIA DE', subtitulo, ornamento },
  difunto: { nombre, apellido, fechaNacimiento, fechaFallecimiento,
             fechasTexto: '10 ABRIL 1948  -  15 MAYO 2024',
             fotoUrl, fotoMarco: 'ovalo', biografia },
  frase,                                    // epitafio en cursiva
  serviciosTitulo: 'INFORMACIÓN DEL SERVICIO',
  servicios: [{                             // embebido, con _id propio
    tipo, titulo: 'VELATORIO', icono: 'calendario',
    fecha, fechaTexto, horaTexto, lugar, direccion, orden, visible }],
  pie: { texto, logoUrl, mostrarLogo },
  mensaje, oracion,                         // opcionales, ocultos por defecto
  secciones: [{ key, visible, orden, titulo }],   // controla render y orden
  estilos: { colorPrimario, colorTexto, colorFondo, tipografia, fondoUrl, texturaPapel },
  estado: 'borrador'|'publicado'|'archivado',
  version, editadoPor, ultimaEdicion, fechaPublicacion }
```
`version` sube automáticamente en el `pre('save')` cuando cambia contenido.

### `condolencias`
```js
{ funerariaId, salaId, pergaminoId,
  difuntoSnapshot: { nombre, apellido },   // ← el pergamino se sobrescribe;
                                           //   esto conserva a quién iba dirigido
  nombre, relacion, email, mensaje,
  estado: 'pendiente'|'aprobada'|'rechazada',
  metadata: { ip, userAgent }, moderadoPor, fechaModeracion }
```

### `media`
```js
{ funerariaId, salaId, pergaminoId, tipo: 'foto'|'logo', seccion,
  titulo, descripcion, tags,
  archivo: { nombreOriginal, nombreAlmacenado, ruta, url, thumbnailUrl,
             mimeType, extension, tamano, ancho, alto, driver: 'local'|'r2' },
  orden, estadoProcesamiento, isActive, subidoPor }
```

---

## 5. Autenticación y permisos

> ⚠️ **NO HAY AUTENTICACIÓN. Todas las rutas están abiertas.** El mecanismo está pendiente de definir (se barajó una API key por usuario en cabecera). **No desplegar así a producción.**

### Estado actual

Ninguna ruta lleva guard. Cualquiera que alcance la API puede leer y modificar los datos de **cualquier** funeraria: crear y borrar funerarias, editar pergaminos, desactivar QR y moderar condolencias.

### Lo que sigue en el repo, sin usar

Se conservan para reconectarlos cuando se decida el mecanismo:

| Archivo | Qué hacía |
|---|---|
| `src/middleware/auth.js` | Verificaba el JWT de core-qr y resolvía `req.user` desde `usuariofunerarias`. Incluye `requireRole`, `requireSuperAdmin`, `scopeFuneraria` |
| `src/middleware/ownership.js` | `requireOwnership(tipo, param)`: resolvía de qué funeraria es un recurso identificado por su propio id (`/salas/:id`, `/pergaminos/:id`…) y comparaba |
| `src/modules/usuarios/` | Gestión de accesos: qué usuario tiene qué rol y en qué funeraria |
| `src/models/UsuarioFuneraria.js` | Mapeo `coreUserId → rol + funerariaId` |

Ninguno se importa desde las rutas hoy. Los bloques `@access` dicen `Abierto (era: …)` para recordar qué protección tenía cada endpoint.

### Al reconectar la autenticación

Hacen falta **dos** cosas, no una:

1. **Autenticar** — identificar quién llama (API key, JWT, lo que se elija).
2. **Aislar por funeraria** — que un usuario no toque los datos de otra. Aquí hay dos casos distintos:
   - La funeraria viene **explícita** en la petición (`:funerariaId`, `:id` de funeraria, body, query) → `scopeFuneraria`
   - El recurso se identifica **por su propio id** (`/salas/:id`, `/pergaminos/:id`, `/qr/:id`) → `requireOwnership('<tipo>', '<param>')`

> Olvidar el segundo caso ya causó un fallo real: con solo `scopeFuneraria`, una funeraria podía leer **y editar** los pergaminos de otra, porque en `/pergaminos/:id` ese middleware no tiene nada que comparar. Ver §11.

Los controllers ya no leen `req.user` ni `req.funerariaScope`: toman los ids de `req.params`. Al volver la auth habrá que reintroducir el scope y, si se quiere trazabilidad, los campos de auditoría (`creadoPor`, `editadoPor`, `subidoPor`, `moderadoPor`), que se retiraron de los modelos al no haber usuario que registrar.

### Rutas públicas por diseño

`GET /api/pergamino/:code` y el libro de condolencias **deben seguir abiertos** aunque se añada autenticación: quien escanea el QR en el velatorio no tiene cuenta. Su protección son los rate limiters, el estado `publicado` del pergamino y el código de acceso opcional del libro.

---

## 6. Comandos

```bash
# Base de datos (Docker)
npm run db:up          # levanta MongoDB en el puerto 27018
npm run db:down        # la detiene
npm run db:reset       # la borra y la recrea desde cero
npm run db:logs        # logs del contenedor
npm run db:ui          # mongo-express en http://localhost:8081 (admin/admin)
npm run db:shell       # mongosh dentro del contenedor

# Aplicación
npm run dev            # nodemon
npm start              # producción
npm run dev:full       # db:up + dev

# Datos
npm run seed:demo      # 1 funeraria + 4 salas + pergamino de ejemplo publicado
npm run check:db       # estado de colecciones, verifica 4 salas por funeraria
npm run clear:db       # vacía las colecciones

# Calidad
npm run lint
```

Credenciales por defecto del seed: `admin@lazospergamino.com` / `admin123456`.

---

## 7. Endpoints

Documentación viva en `GET /api` (siempre actualizada, léela primero).

**Público** (sin token, lo que abre el QR):
```
GET  /api/pergamino/:code                              # pergamino de la sala
GET  /api/pergamino/:code/condolencias                 # mensajes del libro
POST /api/pergamino/:code/condolencias                 # dejar un mensaje
GET  /api/pergamino/:code/condolencias/config
POST /api/pergamino/:code/condolencias/validar-codigo
```

**Sin protección** (era privado): `/api/usuarios`, `/api/admin`, `/api/funerarias`, `/api/salas`, `/api/pergaminos`, `/api/qr`, `/api/media`, `/api/dashboard`, `/api/condolencias`.

Endpoints que conviene conocer:
- `POST /api/funerarias` — registra la funeraria **y aprovisiona sus 4 salas, QR y pergaminos** en una sola llamada
- `POST /api/admin/register-complete` — lo anterior **más** el usuario de la funeraria
- `GET /api/funerarias/:id/completa` — la funeraria con sus 4 salas resueltas
- `GET /api/qr/:id/imagen` — descarga el PNG 512×512 listo para imprimir
- `POST /api/pergaminos/:id/reiniciar` — deja la sala lista para el siguiente servicio

---

## 8. Convenciones de código

- **Idioma**: dominio, campos de BD, mensajes y comentarios en **español**; palabras clave y librerías en inglés. Los comentarios evitan tildes para no depender de la codificación del archivo.
- **Respuestas**: siempre vía `responseHelper` (`success`, `error`, `notFound`, `unauthorized`, `forbidden`, `conflict`, `paginated`, `validationError`). Nunca `res.json()` a pelo en un controller.
- **Errores**: los services lanzan `Error` con mensaje en español; el controller lo captura, hace `console.error` y responde con el helper y el status adecuado.
- **Validación**: todo `req.body` pasa por un esquema Joi de `src/utils/validators.js` mediante `validate(schemas.X)` en la ruta. Los services que se invocan desde otros services revalidan con los helpers `validateFunerariaData` / `validatePergaminoData` / `validateCondolenciaData`.
- **Exportación**: clases instanciadas como singleton — `module.exports = new MiService();`
- **Cabecera**: cada archivo abre con un comentario de su ruta.
- **Documentación de rutas**: bloque `@route / @desc / @access` sobre cada endpoint.

---

## 9. Pruebas

No hay suite automatizada. Las pruebas son **manuales**, vía el módulo `src/modules/test/`, que expone endpoints `/api/test/*`. **No se montan cuando `NODE_ENV=production`** (guarda en `src/routes/index.js`).

```bash
# Escenario completo: funeraria + 4 salas + pergamino publicado + condolencia
# (devuelve además un token de prueba firmado como los de core-qr)
curl -s -X POST http://localhost:3000/api/test/escenario | jq

# Verifica las invariantes del dominio en toda la base
curl -s http://localhost:3000/api/test/integridad | jq

# Índice de todo lo disponible
curl -s http://localhost:3000/api/test | jq
```

`GET /api/test/integridad` comprueba: 4 salas por funeraria, 1 QR y 1 pergamino por sala, punteros correctos y códigos QR sin duplicados. **Úsalo tras cualquier cambio en el aprovisionamiento o en los guards de acceso.**

Los curl completos de todos los endpoints (CRUD, QR, condolencias, media, comprobaciones de aislamiento) están en **`src/modules/test/TEST_ENDPOINTS.md`**.

---

## 10. Al añadir un módulo nuevo

1. Crea las 4 carpetas (`routes`, `controllers`, `services`, `repositories`).
2. Si necesita colección propia, añade el modelo a `src/models/` y la colección a los arrays de `check-database.js`, `clear-database.js` y `docker/mongo-init.js`.
3. Añade los esquemas Joi a `src/utils/validators.js`.
4. Añade constantes y mensajes a `src/utils/constants.js` — no dejes literales sueltos.
5. Monta el router en `src/routes/index.js` **y documenta los endpoints en el `GET /api`**.
6. Si el módulo cuelga de una funeraria, aplica `scopeFuneraria`.

---

## 11. Trampas conocidas

- **Nunca regeneres un código QR.** Ver la invariante de la sección 1.
- **`salaId` es único en `qrs` y en `pergaminos`.** Crear un segundo QR o pergamino para una sala falla con error de duplicado — es intencional.
- **El rollback del aprovisionamiento es manual**, no transaccional: `funerariaService.provisionarSalas()` llama a `limpiarRecursos()` si algo falla a mitad. Si tocas ese flujo, mantén la limpieza.
- **El pergamino se sobrescribe entre servicios**, por eso `condolencias` guarda `difuntoSnapshot`. No lo quites.
- **Mongo corre en el puerto 27018**, no en el 27017, para no chocar con una instalación local.
- **`totalMensajes` en la sala es un contador denormalizado.** Si añades una vía de crear o borrar condolencias, mantenlo sincronizado.
- **Las rutas están abiertas hoy** (§5). Al reconectar la autenticación, no basta con autenticar: hace falta además el guard de aislamiento por funeraria.
- **Toda ruta privada necesita un guard de aislamiento.** `scopeFuneraria` solo mira la funeraria pedida explícitamente: en `/salas/:id` o `/pergaminos/:id` no ve nada y deja pasar. Por eso existe `requireOwnership`. Hubo un fallo real por esto — una funeraria podía leer **y editar** los pergaminos de otra. Cuando vuelva la auth, comprueba el aislamiento con los curl de `TEST_ENDPOINTS.md`.

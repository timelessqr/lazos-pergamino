// ===================================
// src/routes/index.js
// ===================================
const express = require('express');

const usuarioRoutes = require('../modules/usuarios/routes/usuarioRoutes');
const adminRoutes = require('../modules/admin/routes/adminRoutes');
const funerariaRoutes = require('../modules/funerarias/routes/funerariaRoutes');
const salaRoutes = require('../modules/salas/routes/salaRoutes');
const { funerariaSalasRouter } = require('../modules/salas/routes/salaRoutes');
const pergaminoRoutes = require('../modules/pergaminos/routes/pergaminoRoutes');
const qrRoutes = require('../modules/qr/routes/qrRoutes');
const mediaRoutes = require('../modules/media/routes/mediaRoutes');
const dashboardRoutes = require('../modules/dashboard/routes/dashboardRoutes');
const condolenciaRoutes = require('../modules/condolencias/routes/condolenciaRoutes');
const { publicRouter: condolenciasPublicRouter } = require('../modules/condolencias/routes/condolenciaRoutes');

const qrController = require('../modules/qr/controllers/qrController');
const { publicLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth');
const {
  authPublicRouter,
  authPrivateRouter,
  funerariaCuentasRouter,
  cuentasRouter
} = require('../modules/cuentas/routes/cuentaRoutes');

const router = express.Router();

/**
 * Documentacion viva de la API
 */
router.get('/', (req, res) => {
  res.json({
    message: '📜 Lazos Pergamino API - Pergaminos digitales por sala para funerarias',
    version: '1.0.0',
    description: 'Cada funeraria tiene 4 salas fijas. Cada sala tiene 1 QR fijo, 1 pergamino editable y 1 libro de condolencias.',
    endpoints: {
      usuarios: {
        nota: 'La autenticación la maneja core-qr. Este backend solo valida su token.',
        perfil: 'GET /api/usuarios/perfil (privado)',
        darAcceso: 'POST /api/usuarios (superadmin)',
        listar: 'GET /api/usuarios?rol=funeraria (superadmin)',
        porFuneraria: 'GET /api/usuarios/funeraria/:funerariaId (privado)',
        actualizar: 'PUT /api/usuarios/:id (superadmin)',
        revocar: 'DELETE /api/usuarios/:id (superadmin)'
      },
      admin: {
        registerComplete: 'POST /api/admin/register-complete (superadmin)',
        search: 'GET /api/admin/search?q=termino (superadmin)',
        metrics: 'GET /api/admin/metrics (superadmin)',
        health: 'GET /api/admin/health (superadmin)',
        resumenFuneraria: 'GET /api/admin/funerarias/:funerariaId/resumen (superadmin)',
        generarQRs: 'POST /api/admin/funerarias/:funerariaId/qr/generar (superadmin)'
      },
      funerarias: {
        register: 'POST /api/funerarias (superadmin - crea 4 salas + 4 QR + 4 pergaminos)',
        getAll: 'GET /api/funerarias?page=1&limit=20&search=termino (superadmin)',
        stats: 'GET /api/funerarias/stats (superadmin)',
        search: 'GET /api/funerarias/search?q=termino (superadmin)',
        getByCode: 'GET /api/funerarias/code/:codigo (superadmin)',
        getById: 'GET /api/funerarias/:id (privado)',
        getCompleta: 'GET /api/funerarias/:id/completa (privado - con sus 4 salas)',
        update: 'PUT /api/funerarias/:id (privado)',
        delete: 'DELETE /api/funerarias/:id (superadmin)'
      },
      salas: {
        getByFuneraria: 'GET /api/funerarias/:funerariaId/salas (privado)',
        getByNumero: 'GET /api/funerarias/:funerariaId/salas/numero/:numero (privado)',
        getById: 'GET /api/salas/:id (privado)',
        update: 'PUT /api/salas/:id (privado)',
        configLibro: 'PUT /api/salas/:id/libro-condolencias (privado)',
        regenerarCodigo: 'POST /api/salas/:id/libro-condolencias/codigo (privado)'
      },
      pergaminos: {
        opciones: 'GET /api/pergaminos/opciones (privado)',
        getBySala: 'GET /api/pergaminos/sala/:salaId (privado)',
        getByFuneraria: 'GET /api/pergaminos/funeraria/:funerariaId (privado)',
        getById: 'GET /api/pergaminos/:id (privado)',
        update: 'PUT /api/pergaminos/:id (privado)',
        addServicio: 'POST /api/pergaminos/:id/servicios (privado)',
        updateServicio: 'PUT /api/pergaminos/:id/servicios/:servicioId (privado)',
        removeServicio: 'DELETE /api/pergaminos/:id/servicios/:servicioId (privado)',
        reorderServicios: 'PUT /api/pergaminos/:id/servicios/reorder (privado)',
        publicar: 'PUT /api/pergaminos/:id/publicar (privado)',
        archivar: 'PUT /api/pergaminos/:id/archivar (privado)',
        reiniciar: 'POST /api/pergaminos/:id/reiniciar (privado)'
      },
      qr: {
        getByFuneraria: 'GET /api/qr/funeraria/:funerariaId (privado)',
        getBySala: 'GET /api/qr/sala/:salaId (privado)',
        descargarImagen: 'GET /api/qr/:id/imagen (privado - PNG para imprimir)',
        dataUrl: 'GET /api/qr/:id/dataurl (privado)',
        stats: 'GET /api/qr/:id/stats (privado)',
        generarImagen: 'POST /api/qr/:id/imagen (privado)',
        setEstado: 'PUT /api/qr/:id/estado (privado)'
      },
      media: {
        upload: 'POST /api/media/upload/:salaId (privado)',
        getBySala: 'GET /api/media/sala/:salaId (privado)',
        stats: 'GET /api/media/stats/:salaId (privado)',
        reorder: 'PUT /api/media/reorder/:salaId (privado)',
        update: 'PUT /api/media/:id (privado)',
        delete: 'DELETE /api/media/:id (privado)',
        storageInfo: 'GET /api/media/storage/info (privado)'
      },
      dashboard: {
        get: 'GET /api/dashboard (privado - según rol)',
        global: 'GET /api/dashboard/global (superadmin)',
        funeraria: 'GET /api/dashboard/funeraria/:funerariaId (privado)'
      },
      condolencias: {
        admin: {
          getBySala: 'GET /api/condolencias/sala/:salaId (privado)',
          search: 'GET /api/condolencias/sala/:salaId/search?q=termino (privado)',
          stats: 'GET /api/condolencias/sala/:salaId/stats (privado)',
          moderar: 'PUT /api/condolencias/:id/moderar (privado)',
          eliminar: 'DELETE /api/condolencias/:id (privado)'
        },
        publico: {
          config: 'GET /api/pergamino/:code/condolencias/config (público)',
          validarCodigo: 'POST /api/pergamino/:code/condolencias/validar-codigo (público)',
          crear: 'POST /api/pergamino/:code/condolencias (público)',
          listar: 'GET /api/pergamino/:code/condolencias (público)'
        }
      },
      publico: {
        pergamino: 'GET /api/pergamino/:code (público - se abre al escanear el QR de la sala)'
      }
    },
    modeloNegocio: {
      description: 'Plataforma de pergaminos digitales para funerarias',
      reglas: [
        'Cada funeraria registrada obtiene automáticamente 4 salas fijas',
        'Cada sala tiene 1 QR fijo e inmutable (se imprime una sola vez)',
        'Cada sala tiene 1 pergamino editable que la funeraria personaliza',
        'Cada sala tiene 1 libro de condolencias propio',
        'Al terminar un velatorio el pergamino se reinicia: el QR NO cambia'
      ],
      flujo: [
        '1. El superadmin registra la funeraria',
        '2. El sistema crea sus 4 salas con QR y pergamino en blanco',
        '3. La funeraria imprime los 4 QR y los coloca en cada sala',
        '4. Al llegar un servicio, la funeraria edita el pergamino de esa sala',
        '5. Publica el pergamino',
        '6. Los visitantes escanean el QR de la sala y ven el pergamino',
        '7. Los visitantes dejan mensajes en el libro de condolencias',
        '8. Al terminar, la funeraria reinicia el pergamino para el siguiente servicio'
      ],
      autenticacion: {
        proveedor: 'core-qr',
        descripcion: 'core-qr emite el JWT en su login. Este backend verifica la firma (mismo JWT_SECRET) y traduce el userId a rol y funeraria vía la colección usuariofunerarias.',
        cabecera: 'Authorization: Bearer <token de core-qr>'
      },
      roles: {
        superadmin: 'Dueño de la plataforma: registra funerarias y ve métricas globales',
        funeraria: 'Gestiona sus 4 salas, pergaminos y libros de condolencias',
        publico: 'Escanea el QR, ve el pergamino y deja condolencias sin registrarse'
      }
    },
    status: 'Funcionando ✅',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ----- Rutas publicas (lo que abre el QR de la sala) -----
// Van antes del authMiddleware: quien escanea el QR no tiene cuenta
router.use('/pergamino', condolenciasPublicRouter);

// Login de las cuentas de funeraria
router.use('/auth', authPublicRouter);
router.get('/pergamino/:code', publicLimiter, qrController.accederPergamino);

// ----- Modulo de pruebas manuales (nunca en produccion) -----
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', require('../modules/test/routes/testRoutes'));
}

// ----- Rutas privadas -----
// Todas exigen el token de core-qr. El aislamiento entre funerarias
// (scopeFuneraria / requireOwnership / requireSuperAdmin) va en cada ruta.
router.use(authMiddleware);

router.use('/auth', authPrivateRouter);
router.use('/usuarios', usuarioRoutes);
router.use('/admin', adminRoutes);
router.use('/funerarias', funerariaRoutes);
router.use('/funerarias/:funerariaId/salas', funerariaSalasRouter);
router.use('/funerarias/:funerariaId/cuentas', funerariaCuentasRouter);
router.use('/cuentas', cuentasRouter);
router.use('/salas', salaRoutes);
router.use('/pergaminos', pergaminoRoutes);
router.use('/qr', qrRoutes);
router.use('/media', mediaRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/condolencias', condolenciaRoutes);

module.exports = router;

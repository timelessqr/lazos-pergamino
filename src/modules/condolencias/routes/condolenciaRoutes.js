// ===================================
// src/modules/condolencias/routes/condolenciaRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const condolenciaController = require('../controllers/condolenciaController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');
const { condolenciaLimiter, publicLimiter } = require('../../../middleware/rateLimiter');

/**
 * @route   GET /api/condolencias/sala/:salaId
 * @desc    Todos los mensajes del libro de una sala (incluye pendientes)
 * @access  Abierto (era: Private)
 * @query   page, limit, estado
 */
router.get('/sala/:salaId', validateObjectId('salaId'), condolenciaController.getBySala);

/**
 * @route   GET /api/condolencias/sala/:salaId/search
 * @desc    Buscar mensajes dentro del libro
 * @access  Abierto (era: Private)
 * @query   q, limit
 */
router.get('/sala/:salaId/search', validateObjectId('salaId'), condolenciaController.search);

/**
 * @route   GET /api/condolencias/sala/:salaId/stats
 * @desc    Estadísticas del libro de condolencias
 * @access  Abierto (era: Private)
 */
router.get('/sala/:salaId/stats', validateObjectId('salaId'), condolenciaController.getStats);

/**
 * @route   PUT /api/condolencias/:id/moderar
 * @desc    Aprobar o rechazar un mensaje
 * @access  Abierto (era: Private)
 * @body    { estado: 'aprobada' | 'rechazada' }
 */
router.put('/:id/moderar', validateObjectId('id'), condolenciaController.moderar);

/**
 * @route   DELETE /api/condolencias/:id
 * @desc    Eliminar un mensaje
 * @access  Abierto (era: Private)
 */
router.delete('/:id', validateObjectId('id'), condolenciaController.eliminar);

// ============ RUTAS DEL LIBRO VIA CODIGO QR DE LA SALA ============
const publicRouter = express.Router();

/**
 * @route   GET /api/pergamino/:code/condolencias/config
 * @desc    Configuración del libro de la sala
 * @access  Public
 */
publicRouter.get('/:code/condolencias/config', publicLimiter, condolenciaController.getConfig);

/**
 * @route   POST /api/pergamino/:code/condolencias/validar-codigo
 * @desc    Validar el código de acceso al libro
 * @access  Public
 */
publicRouter.post(
  '/:code/condolencias/validar-codigo',
  publicLimiter,
  validate(schemas.validarCodigo),
  condolenciaController.validarCodigo
);

/**
 * @route   POST /api/pergamino/:code/condolencias
 * @desc    Dejar un mensaje en el libro de condolencias
 * @access  Public
 */
publicRouter.post(
  '/:code/condolencias',
  condolenciaLimiter,
  validate(schemas.condolencia),
  condolenciaController.crear
);

/**
 * @route   GET /api/pergamino/:code/condolencias
 * @desc    Mensajes visibles del libro
 * @access  Public
 * @query   page, limit
 */
publicRouter.get('/:code/condolencias', publicLimiter, condolenciaController.getPublicas);

module.exports = router;
module.exports.publicRouter = publicRouter;

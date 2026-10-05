// ===================================
// src/modules/funerarias/routes/funerariaRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const funerariaController = require('../controllers/funerariaController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

/**
 * @route   POST /api/funerarias
 * @desc    Registrar funeraria (crea automáticamente sus 4 salas, QR y pergaminos)
 * @access  Abierto (era: Superadmin)
 */
router.post('/', validate(schemas.funeraria), funerariaController.register);

/**
 * @route   GET /api/funerarias
 * @desc    Listar funerarias
 * @access  Abierto (era: Superadmin)
 * @query   page, limit, search, sortBy, sortOrder
 */
router.get('/', funerariaController.getAll);

/**
 * @route   GET /api/funerarias/stats
 * @desc    Estadísticas de funerarias
 * @access  Abierto (era: Superadmin)
 */
router.get('/stats', funerariaController.getStats);

/**
 * @route   GET /api/funerarias/search
 * @desc    Buscar funerarias
 * @access  Abierto (era: Superadmin)
 * @query   q, limit
 */
router.get('/search', funerariaController.search);

/**
 * @route   GET /api/funerarias/code/:codigo
 * @desc    Obtener funeraria por código (FUN-001)
 * @access  Abierto (era: Superadmin)
 */
router.get('/code/:codigo', funerariaController.getByCode);

/**
 * @route   GET /api/funerarias/:id
 * @desc    Obtener funeraria por ID
 * @access  Abierto (era: Private) (Superadmin o dueño)
 */
router.get('/:id', validateObjectId('id'), funerariaController.getById);

/**
 * @route   GET /api/funerarias/:id/completa
 * @desc    Funeraria + sus 4 salas con QR y pergamino
 * @access  Abierto (era: Private) (Superadmin o dueño)
 */
router.get('/:id/completa', validateObjectId('id'), funerariaController.getCompleta);

/**
 * @route   PUT /api/funerarias/:id
 * @desc    Actualizar funeraria
 * @access  Abierto (era: Private) (Superadmin o dueño)
 */
router.put('/:id', validateObjectId('id'), validate(schemas.funerariaUpdate), funerariaController.update);

/**
 * @route   DELETE /api/funerarias/:id
 * @desc    Desactivar funeraria (soft delete)
 * @access  Abierto (era: Superadmin)
 */
router.delete('/:id', validateObjectId('id'), funerariaController.delete);

module.exports = router;

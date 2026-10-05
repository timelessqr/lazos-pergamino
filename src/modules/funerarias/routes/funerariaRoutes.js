// ===================================
// src/modules/funerarias/routes/funerariaRoutes.js
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { requireSuperAdmin, scopeFuneraria } = require('../../../middleware/auth');
const router = express.Router();
const funerariaController = require('../controllers/funerariaController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');
const { upload, handleUploadError } = require('../../../middleware/upload');

/**
 * @route   POST /api/funerarias
 * @desc    Registrar funeraria (crea automáticamente sus 4 salas, QR y pergaminos)
 * @access  Superadmin
 */
router.post('/', requireSuperAdmin, validate(schemas.funeraria), funerariaController.register);

/**
 * @route   GET /api/funerarias
 * @desc    Listar funerarias
 * @access  Superadmin
 * @query   page, limit, search, sortBy, sortOrder
 */
router.get('/', requireSuperAdmin, funerariaController.getAll);

/**
 * @route   GET /api/funerarias/stats
 * @desc    Estadísticas de funerarias
 * @access  Superadmin
 */
router.get('/stats', requireSuperAdmin, funerariaController.getStats);

/**
 * @route   GET /api/funerarias/search
 * @desc    Buscar funerarias
 * @access  Superadmin
 * @query   q, limit
 */
router.get('/search', requireSuperAdmin, funerariaController.search);

/**
 * @route   GET /api/funerarias/code/:codigo
 * @desc    Obtener funeraria por código (FUN-001)
 * @access  Superadmin
 */
router.get('/code/:codigo', requireSuperAdmin, funerariaController.getByCode);

/**
 * @route   GET /api/funerarias/:id
 * @desc    Obtener funeraria por ID
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/:id', scopeFuneraria, validateObjectId('id'), funerariaController.getById);

/**
 * @route   GET /api/funerarias/:id/completa
 * @desc    Funeraria + sus 4 salas con QR y pergamino
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/:id/completa', scopeFuneraria, validateObjectId('id'), funerariaController.getCompleta);

/**
 * @route   PUT /api/funerarias/:id
 * @desc    Actualizar funeraria
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put('/:id', scopeFuneraria, validateObjectId('id'), validate(schemas.funerariaUpdate), funerariaController.update);

/**
 * @route   PUT /api/funerarias/:id/marca
 * @desc    Logo y colores de la funeraria, aplicados a los pergaminos de sus salas
 * @access  Private (superadmin o la funeraria dueña)
 * @body    { logoUrl?, colorPrimario?, colorTexto?, colorFondo? }
 */
router.put(
  '/:id/marca',
  scopeFuneraria,
  validateObjectId('id'),
  validate(schemas.marcaFuneraria),
  funerariaController.actualizarMarca
);

/**
 * @route   POST /api/funerarias/:id/logo
 * @desc    Subir el logo (campo multipart "archivo") y aplicarlo a sus pergaminos
 * @access  Private (superadmin o la funeraria dueña)
 */
router.post(
  '/:id/logo',
  scopeFuneraria,
  validateObjectId('id'),
  upload.single('archivo'),
  handleUploadError,
  funerariaController.subirLogo
);

/**
 * @route   DELETE /api/funerarias/:id
 * @desc    Desactivar funeraria (soft delete)
 * @access  Superadmin
 */
router.delete('/:id', requireSuperAdmin, validateObjectId('id'), funerariaController.delete);

module.exports = router;

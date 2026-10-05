// ===================================
// src/modules/salas/routes/salaRoutes.js
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { scopeFuneraria } = require('../../../middleware/auth');
const { requireOwnership } = require('../../../middleware/ownership');
const router = express.Router();
const salaController = require('../controllers/salaController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

/**
 * @route   GET /api/salas/:id
 * @desc    Obtener una sala con su QR, pergamino y stats del libro
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/:id', requireOwnership('sala', 'id'), validateObjectId('id'), salaController.getById);

/**
 * @route   PUT /api/salas/:id
 * @desc    Actualizar datos editables de la sala
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put('/:id', requireOwnership('sala', 'id'), validateObjectId('id'), validate(schemas.salaUpdate), salaController.update);

/**
 * @route   PUT /api/salas/:id/libro-condolencias
 * @desc    Configurar el libro de condolencias de la sala
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put(
  '/:id/libro-condolencias',
  requireOwnership('sala', 'id'),
  validateObjectId('id'),
  validate(schemas.condolenciasConfig),
  salaController.updateLibroConfig
);

/**
 * @route   POST /api/salas/:id/libro-condolencias/codigo
 * @desc    Regenerar el código de acceso del libro
 * @access  Private (superadmin o la funeraria dueña)
 */
router.post('/:id/libro-condolencias/codigo', requireOwnership('sala', 'id'), validateObjectId('id'), salaController.regenerarCodigo);

const funerariaSalasRouter = express.Router({ mergeParams: true });

/**
 * @route   GET /api/funerarias/:funerariaId/salas
 * @desc    Listar las 4 salas de la funeraria
 * @access  Private (superadmin o la funeraria dueña)
 */
funerariaSalasRouter.get('/', scopeFuneraria, salaController.getByFuneraria);

/**
 * @route   GET /api/funerarias/:funerariaId/salas/numero/:numero
 * @desc    Obtener una sala por su número (1..4)
 * @access  Private (superadmin o la funeraria dueña)
 */
funerariaSalasRouter.get('/numero/:numero', scopeFuneraria, salaController.getByNumero);

module.exports = router;
module.exports.funerariaSalasRouter = funerariaSalasRouter;

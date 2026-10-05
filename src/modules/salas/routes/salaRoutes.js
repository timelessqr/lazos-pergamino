// ===================================
// src/modules/salas/routes/salaRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const salaController = require('../controllers/salaController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

/**
 * @route   GET /api/salas/:id
 * @desc    Obtener una sala con su QR, pergamino y stats del libro
 * @access  Abierto (era: Private)
 */
router.get('/:id', validateObjectId('id'), salaController.getById);

/**
 * @route   PUT /api/salas/:id
 * @desc    Actualizar datos editables de la sala
 * @access  Abierto (era: Private)
 */
router.put('/:id', validateObjectId('id'), validate(schemas.salaUpdate), salaController.update);

/**
 * @route   PUT /api/salas/:id/libro-condolencias
 * @desc    Configurar el libro de condolencias de la sala
 * @access  Abierto (era: Private)
 */
router.put(
  '/:id/libro-condolencias',
  validateObjectId('id'),
  validate(schemas.condolenciasConfig),
  salaController.updateLibroConfig
);

/**
 * @route   POST /api/salas/:id/libro-condolencias/codigo
 * @desc    Regenerar el código de acceso del libro
 * @access  Abierto (era: Private)
 */
router.post('/:id/libro-condolencias/codigo', validateObjectId('id'), salaController.regenerarCodigo);

const funerariaSalasRouter = express.Router({ mergeParams: true });

/**
 * @route   GET /api/funerarias/:funerariaId/salas
 * @desc    Listar las 4 salas de la funeraria
 * @access  Abierto (era: Private)
 */
funerariaSalasRouter.get('/', salaController.getByFuneraria);

/**
 * @route   GET /api/funerarias/:funerariaId/salas/numero/:numero
 * @desc    Obtener una sala por su número (1..4)
 * @access  Abierto (era: Private)
 */
funerariaSalasRouter.get('/numero/:numero', salaController.getByNumero);

module.exports = router;
module.exports.funerariaSalasRouter = funerariaSalasRouter;

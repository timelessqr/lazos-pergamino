// ===================================
// src/modules/pergaminos/routes/pergaminoRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const pergaminoController = require('../controllers/pergaminoController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

/**
 * @route   GET /api/pergaminos/opciones
 * @desc    Catálogo del editor: plantillas, tipos de servicio e iconos
 * @access  Abierto (era: Private)
 */
router.get('/opciones', pergaminoController.getOpciones);

/**
 * @route   GET /api/pergaminos/sala/:salaId
 * @desc    Obtener el pergamino de una sala
 * @access  Abierto (era: Private)
 */
router.get('/sala/:salaId', validateObjectId('salaId'), pergaminoController.getBySala);

/**
 * @route   GET /api/pergaminos/funeraria/:funerariaId
 * @desc    Listar los pergaminos de una funeraria
 * @access  Abierto (era: Private)
 * @query   estado
 */
router.get(
  '/funeraria/:funerariaId',
  validateObjectId('funerariaId'),
  pergaminoController.getByFuneraria
);

/**
 * @route   GET /api/pergaminos/:id
 * @desc    Obtener pergamino por ID
 * @access  Abierto (era: Private)
 */
router.get('/:id', validateObjectId('id'), pergaminoController.getById);

/**
 * @route   PUT /api/pergaminos/:id
 * @desc    Editar el contenido del pergamino
 * @access  Abierto (era: Private)
 */
router.put('/:id', validateObjectId('id'), validate(schemas.pergaminoUpdate), pergaminoController.update);

/**
 * @route   PUT /api/pergaminos/:id/servicios/reorder
 * @desc    Reordenar los bloques de "INFORMACIÓN DEL SERVICIO"
 * @access  Abierto (era: Private)
 * @body    { orden: [servicioId, ...] }
 */
router.put('/:id/servicios/reorder', validateObjectId('id'), pergaminoController.reorderServicios);

/**
 * @route   POST /api/pergaminos/:id/servicios
 * @desc    Agregar un bloque de servicio (velatorio, ceremonia, sepultura...)
 * @access  Abierto (era: Private)
 */
router.post('/:id/servicios', validateObjectId('id'), validate(schemas.servicio), pergaminoController.addServicio);

/**
 * @route   PUT /api/pergaminos/:id/servicios/:servicioId
 * @desc    Editar un bloque de servicio
 * @access  Abierto (era: Private)
 */
router.put(
  '/:id/servicios/:servicioId',
  validateObjectId('id', 'servicioId'),
  pergaminoController.updateServicio
);

/**
 * @route   DELETE /api/pergaminos/:id/servicios/:servicioId
 * @desc    Eliminar un bloque de servicio
 * @access  Abierto (era: Private)
 */
router.delete(
  '/:id/servicios/:servicioId',
  validateObjectId('id', 'servicioId'),
  pergaminoController.removeServicio
);

/**
 * @route   PUT /api/pergaminos/:id/publicar
 * @desc    Publicar el pergamino (visible al escanear el QR)
 * @access  Abierto (era: Private)
 */
router.put('/:id/publicar', validateObjectId('id'), pergaminoController.publicar);

/**
 * @route   PUT /api/pergaminos/:id/archivar
 * @desc    Archivar el pergamino (fin del velatorio)
 * @access  Abierto (era: Private)
 */
router.put('/:id/archivar', validateObjectId('id'), pergaminoController.archivar);

/**
 * @route   POST /api/pergaminos/:id/reiniciar
 * @desc    Dejar la sala lista para un nuevo servicio (el QR no cambia)
 * @access  Abierto (era: Private)
 */
router.post('/:id/reiniciar', validateObjectId('id'), pergaminoController.reiniciar);

module.exports = router;

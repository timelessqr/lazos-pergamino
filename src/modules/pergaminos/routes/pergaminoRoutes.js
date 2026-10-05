// ===================================
// src/modules/pergaminos/routes/pergaminoRoutes.js
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { scopeFuneraria } = require('../../../middleware/auth');
const { requireOwnership } = require('../../../middleware/ownership');
const router = express.Router();
const pergaminoController = require('../controllers/pergaminoController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

/**
 * @route   GET /api/pergaminos/opciones
 * @desc    Catálogo del editor: plantillas, tipos de servicio e iconos
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/opciones', pergaminoController.getOpciones);

/**
 * @route   GET /api/pergaminos/sala/:salaId
 * @desc    Obtener el pergamino de una sala
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/sala/:salaId', requireOwnership('sala', 'salaId'), validateObjectId('salaId'), pergaminoController.getBySala);

/**
 * @route   GET /api/pergaminos/funeraria/:funerariaId
 * @desc    Listar los pergaminos de una funeraria
 * @access  Private (superadmin o la funeraria dueña)
 * @query   estado
 */
router.get(
  '/funeraria/:funerariaId',
  scopeFuneraria,
  validateObjectId('funerariaId'),
  pergaminoController.getByFuneraria
);

/**
 * @route   GET /api/pergaminos/:id
 * @desc    Obtener pergamino por ID
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/:id', requireOwnership('pergamino', 'id'), validateObjectId('id'), pergaminoController.getById);

/**
 * @route   PUT /api/pergaminos/:id
 * @desc    Editar el contenido del pergamino
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put('/:id', requireOwnership('pergamino', 'id'), validateObjectId('id'), validate(schemas.pergaminoUpdate), pergaminoController.update);

/**
 * @route   PUT /api/pergaminos/:id/servicios/reorder
 * @desc    Reordenar los bloques de "INFORMACIÓN DEL SERVICIO"
 * @access  Private (superadmin o la funeraria dueña)
 * @body    { orden: [servicioId, ...] }
 */
router.put('/:id/servicios/reorder', requireOwnership('pergamino', 'id'), validateObjectId('id'), pergaminoController.reorderServicios);

/**
 * @route   POST /api/pergaminos/:id/servicios
 * @desc    Agregar un bloque de servicio (velatorio, ceremonia, sepultura...)
 * @access  Private (superadmin o la funeraria dueña)
 */
router.post('/:id/servicios', requireOwnership('pergamino', 'id'), validateObjectId('id'), validate(schemas.servicio), pergaminoController.addServicio);

/**
 * @route   PUT /api/pergaminos/:id/servicios/:servicioId
 * @desc    Editar un bloque de servicio
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put(
  '/:id/servicios/:servicioId',
  requireOwnership('pergamino', 'id'),
  validateObjectId('id', 'servicioId'),
  pergaminoController.updateServicio
);

/**
 * @route   DELETE /api/pergaminos/:id/servicios/:servicioId
 * @desc    Eliminar un bloque de servicio
 * @access  Private (superadmin o la funeraria dueña)
 */
router.delete(
  '/:id/servicios/:servicioId',
  requireOwnership('pergamino', 'id'),
  validateObjectId('id', 'servicioId'),
  pergaminoController.removeServicio
);

/**
 * @route   PUT /api/pergaminos/:id/publicar
 * @desc    Publicar el pergamino (visible al escanear el QR)
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put('/:id/publicar', requireOwnership('pergamino', 'id'), validateObjectId('id'), pergaminoController.publicar);

/**
 * @route   PUT /api/pergaminos/:id/archivar
 * @desc    Archivar el pergamino (fin del velatorio)
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put('/:id/archivar', requireOwnership('pergamino', 'id'), validateObjectId('id'), pergaminoController.archivar);

/**
 * @route   POST /api/pergaminos/:id/reiniciar
 * @desc    Dejar la sala lista para un nuevo servicio (el QR no cambia)
 * @access  Private (superadmin o la funeraria dueña)
 */
router.post('/:id/reiniciar', requireOwnership('pergamino', 'id'), validateObjectId('id'), pergaminoController.reiniciar);

module.exports = router;

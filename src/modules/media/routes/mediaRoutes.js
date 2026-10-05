// ===================================
// src/modules/media/routes/mediaRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const storageController = require('../controllers/storageController');
const { upload, handleUploadError } = require('../../../middleware/upload');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   GET /api/media/storage/info
 * @desc    Driver de almacenamiento en uso (local o R2)
 * @access  Abierto (era: Private)
 */
router.get('/storage/info', storageController.getInfo);

/**
 * @route   POST /api/media/upload/:salaId
 * @desc    Subir una foto para el pergamino de la sala
 * @access  Abierto (era: Private)
 */
router.post(
  '/upload/:salaId',
  validateObjectId('salaId'),
  upload.single('archivo'),
  handleUploadError,
  mediaController.upload
);

/**
 * @route   GET /api/media/sala/:salaId
 * @desc    Listar los archivos de una sala
 * @access  Abierto (era: Private)
 * @query   seccion
 */
router.get('/sala/:salaId', validateObjectId('salaId'), mediaController.getBySala);

/**
 * @route   GET /api/media/stats/:salaId
 * @desc    Uso de almacenamiento de la sala
 * @access  Abierto (era: Private)
 */
router.get('/stats/:salaId', validateObjectId('salaId'), mediaController.getStats);

/**
 * @route   PUT /api/media/reorder/:salaId
 * @desc    Reordenar los archivos de la sala
 * @access  Abierto (era: Private)
 * @body    { orden: [mediaId, ...] }
 */
router.put('/reorder/:salaId', validateObjectId('salaId'), mediaController.reorder);

/**
 * @route   PUT /api/media/:id
 * @desc    Actualizar metadatos del archivo
 * @access  Abierto (era: Private)
 */
router.put('/:id', validateObjectId('id'), mediaController.update);

/**
 * @route   DELETE /api/media/:id
 * @desc    Eliminar archivo
 * @access  Abierto (era: Private)
 */
router.delete('/:id', validateObjectId('id'), mediaController.delete);

module.exports = router;

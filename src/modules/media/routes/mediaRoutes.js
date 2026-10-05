// ===================================
// src/modules/media/routes/mediaRoutes.js
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { requireOwnership } = require('../../../middleware/ownership');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const storageController = require('../controllers/storageController');
const { upload, handleUploadError } = require('../../../middleware/upload');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   GET /api/media/storage/info
 * @desc    Driver de almacenamiento en uso (local o R2)
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/storage/info', storageController.getInfo);

/**
 * @route   POST /api/media/upload/:salaId
 * @desc    Subir una foto para el pergamino de la sala
 * @access  Private (superadmin o la funeraria dueña)
 */
router.post(
  '/upload/:salaId',
  requireOwnership('sala', 'salaId'),
  validateObjectId('salaId'),
  upload.single('archivo'),
  handleUploadError,
  mediaController.upload
);

/**
 * @route   GET /api/media/sala/:salaId
 * @desc    Listar los archivos de una sala
 * @access  Private (superadmin o la funeraria dueña)
 * @query   seccion
 */
router.get('/sala/:salaId', requireOwnership('sala', 'salaId'), validateObjectId('salaId'), mediaController.getBySala);

/**
 * @route   GET /api/media/stats/:salaId
 * @desc    Uso de almacenamiento de la sala
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/stats/:salaId', requireOwnership('sala', 'salaId'), validateObjectId('salaId'), mediaController.getStats);

/**
 * @route   PUT /api/media/reorder/:salaId
 * @desc    Reordenar los archivos de la sala
 * @access  Private (superadmin o la funeraria dueña)
 * @body    { orden: [mediaId, ...] }
 */
router.put('/reorder/:salaId', requireOwnership('sala', 'salaId'), validateObjectId('salaId'), mediaController.reorder);

/**
 * @route   PUT /api/media/:id
 * @desc    Actualizar metadatos del archivo
 * @access  Private (superadmin o la funeraria dueña)
 */
router.put('/:id', requireOwnership('media', 'id'), validateObjectId('id'), mediaController.update);

/**
 * @route   DELETE /api/media/:id
 * @desc    Eliminar archivo
 * @access  Private (superadmin o la funeraria dueña)
 */
router.delete('/:id', requireOwnership('media', 'id'), validateObjectId('id'), mediaController.delete);

module.exports = router;

// ===================================
// src/modules/qr/routes/qrRoutes.js
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { scopeFuneraria } = require('../../../middleware/auth');
const { requireOwnership } = require('../../../middleware/ownership');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   GET /api/qr/funeraria/:funerariaId
 * @desc    Listar los 4 QR fijos de la funeraria
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get(
  '/funeraria/:funerariaId',
  scopeFuneraria,
  validateObjectId('funerariaId'),
  qrController.getByFuneraria
);

/**
 * @route   GET /api/qr/sala/:salaId
 * @desc    Obtener el QR de una sala
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/sala/:salaId', requireOwnership('sala', 'salaId'), validateObjectId('salaId'), qrController.getBySala);

/**
 * @route   GET /api/qr/:id/imagen
 * @desc    Descargar el PNG del QR listo para imprimir
 * @access  Private (superadmin o la funeraria dueña)
 * @query   dark, light (colores en hex)
 */
router.get('/:id/imagen', requireOwnership('qr', 'id'), validateObjectId('id'), qrController.downloadImagen);

/**
 * @route   GET /api/qr/:id/dataurl
 * @desc    Obtener el QR como data URL para previsualizar
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/:id/dataurl', requireOwnership('qr', 'id'), validateObjectId('id'), qrController.getDataURL);

/**
 * @route   GET /api/qr/:id/stats
 * @desc    Estadísticas de escaneo del QR
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/:id/stats', requireOwnership('qr', 'id'), validateObjectId('id'), qrController.getStats);

/**
 * @route   POST /api/qr/:id/imagen
 * @desc    Generar la imagen del QR y guardarla en el storage
 * @access  Private (superadmin o la funeraria dueña)
 */
router.post('/:id/imagen', requireOwnership('qr', 'id'), validateObjectId('id'), qrController.generarImagen);

/**
 * @route   PUT /api/qr/:id/estado
 * @desc    Activar o desactivar el QR
 * @access  Private (superadmin o la funeraria dueña)
 * @body    { isActive: boolean }
 */
router.put('/:id/estado', requireOwnership('qr', 'id'), validateObjectId('id'), qrController.setActive);

module.exports = router;

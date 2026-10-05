// ===================================
// src/modules/qr/routes/qrRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   GET /api/qr/funeraria/:funerariaId
 * @desc    Listar los 4 QR fijos de la funeraria
 * @access  Abierto (era: Private)
 */
router.get(
  '/funeraria/:funerariaId',
  validateObjectId('funerariaId'),
  qrController.getByFuneraria
);

/**
 * @route   GET /api/qr/sala/:salaId
 * @desc    Obtener el QR de una sala
 * @access  Abierto (era: Private)
 */
router.get('/sala/:salaId', validateObjectId('salaId'), qrController.getBySala);

/**
 * @route   GET /api/qr/:id/imagen
 * @desc    Descargar el PNG del QR listo para imprimir
 * @access  Abierto (era: Private)
 * @query   dark, light (colores en hex)
 */
router.get('/:id/imagen', validateObjectId('id'), qrController.downloadImagen);

/**
 * @route   GET /api/qr/:id/dataurl
 * @desc    Obtener el QR como data URL para previsualizar
 * @access  Abierto (era: Private)
 */
router.get('/:id/dataurl', validateObjectId('id'), qrController.getDataURL);

/**
 * @route   GET /api/qr/:id/stats
 * @desc    Estadísticas de escaneo del QR
 * @access  Abierto (era: Private)
 */
router.get('/:id/stats', validateObjectId('id'), qrController.getStats);

/**
 * @route   POST /api/qr/:id/imagen
 * @desc    Generar la imagen del QR y guardarla en el storage
 * @access  Abierto (era: Private)
 */
router.post('/:id/imagen', validateObjectId('id'), qrController.generarImagen);

/**
 * @route   PUT /api/qr/:id/estado
 * @desc    Activar o desactivar el QR
 * @access  Abierto (era: Private)
 * @body    { isActive: boolean }
 */
router.put('/:id/estado', validateObjectId('id'), qrController.setActive);

module.exports = router;

// ===================================
// src/modules/admin/routes/adminRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   POST /api/admin/register-complete
 * @desc    Alta completa: funeraria + 4 salas + 4 QR + 4 pergaminos + usuario
 * @access  Abierto (era: Superadmin)
 * @body    { funeraria: {...}, usuario: {...} }
 */
router.post('/register-complete', adminController.registerComplete);

/**
 * @route   GET /api/admin/search
 * @desc    Búsqueda global de funerarias
 * @access  Abierto (era: Superadmin)
 * @query   q, limit
 */
router.get('/search', adminController.search);

/**
 * @route   GET /api/admin/metrics
 * @desc    Métricas globales de la plataforma
 * @access  Abierto (era: Superadmin)
 */
router.get('/metrics', adminController.getMetrics);

/**
 * @route   GET /api/admin/health
 * @desc    Estado de salud del sistema
 * @access  Abierto (era: Superadmin)
 */
router.get('/health', adminController.getHealth);

/**
 * @route   GET /api/admin/funerarias/:funerariaId/resumen
 * @desc    Resumen operativo de una funeraria
 * @access  Abierto (era: Superadmin)
 */
router.get(
  '/funerarias/:funerariaId/resumen',
  validateObjectId('funerariaId'),
  adminController.getResumen
);

/**
 * @route   POST /api/admin/funerarias/:funerariaId/qr/generar
 * @desc    Generar las imágenes de los 4 QR para imprimir
 * @access  Abierto (era: Superadmin)
 */
router.post(
  '/funerarias/:funerariaId/qr/generar',
  validateObjectId('funerariaId'),
  adminController.generarQRs
);

module.exports = router;

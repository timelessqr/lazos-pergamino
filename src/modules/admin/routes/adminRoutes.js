// ===================================
// src/modules/admin/routes/adminRoutes.js
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { requireSuperAdmin } = require('../../../middleware/auth');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   POST /api/admin/register-complete
 * @desc    Alta completa: funeraria + 4 salas + 4 QR + 4 pergaminos + usuario
 * @access  Superadmin
 * @body    { funeraria: {...}, usuario: {...} }
 */
router.post('/register-complete', requireSuperAdmin, adminController.registerComplete);

/**
 * @route   GET /api/admin/search
 * @desc    Búsqueda global de funerarias
 * @access  Superadmin
 * @query   q, limit
 */
router.get('/search', requireSuperAdmin, adminController.search);

/**
 * @route   GET /api/admin/metrics
 * @desc    Métricas globales de la plataforma
 * @access  Superadmin
 */
router.get('/metrics', requireSuperAdmin, adminController.getMetrics);

/**
 * @route   GET /api/admin/health
 * @desc    Estado de salud del sistema
 * @access  Superadmin
 */
router.get('/health', requireSuperAdmin, adminController.getHealth);

/**
 * @route   GET /api/admin/funerarias/:funerariaId/resumen
 * @desc    Resumen operativo de una funeraria
 * @access  Superadmin
 */
router.get(
  '/funerarias/:funerariaId/resumen',
  requireSuperAdmin,
  validateObjectId('funerariaId'),
  adminController.getResumen
);

/**
 * @route   POST /api/admin/funerarias/:funerariaId/qr/generar
 * @desc    Generar las imágenes de los 4 QR para imprimir
 * @access  Superadmin
 */
router.post(
  '/funerarias/:funerariaId/qr/generar',
  requireSuperAdmin,
  validateObjectId('funerariaId'),
  adminController.generarQRs
);

module.exports = router;

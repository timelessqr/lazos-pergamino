// ===================================
// src/modules/dashboard/routes/dashboardRoutes.js
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { requireSuperAdmin, scopeFuneraria } = require('../../../middleware/auth');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   GET /api/dashboard
 * @desc    Dashboard según el rol del usuario autenticado
 * @access  Superadmin (devuelve el dashboard global)
 */
router.get('/', requireSuperAdmin, dashboardController.get);

/**
 * @route   GET /api/dashboard/global
 * @desc    Dashboard global de la plataforma
 * @access  Superadmin
 */
router.get('/global', requireSuperAdmin, dashboardController.getGlobal);

/**
 * @route   GET /api/dashboard/funeraria/:funerariaId
 * @desc    Dashboard de una funeraria con sus 4 salas
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get(
  '/funeraria/:funerariaId',
  scopeFuneraria,
  validateObjectId('funerariaId'),
  dashboardController.getFuneraria
);

module.exports = router;

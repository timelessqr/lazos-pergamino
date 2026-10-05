// ===================================
// src/modules/dashboard/routes/dashboardRoutes.js
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   GET /api/dashboard
 * @desc    Dashboard según el rol del usuario autenticado
 * @access  Abierto (era: Private)
 */
router.get('/', dashboardController.get);

/**
 * @route   GET /api/dashboard/global
 * @desc    Dashboard global de la plataforma
 * @access  Abierto (era: Superadmin)
 */
router.get('/global', dashboardController.getGlobal);

/**
 * @route   GET /api/dashboard/funeraria/:funerariaId
 * @desc    Dashboard de una funeraria con sus 4 salas
 * @access  Abierto (era: Private)
 */
router.get(
  '/funeraria/:funerariaId',
  validateObjectId('funerariaId'),
  dashboardController.getFuneraria
);

module.exports = router;

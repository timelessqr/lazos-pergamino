// ===================================
// src/modules/cuentas/routes/cuentaRoutes.js
// ===================================
// Cuatro routers, porque se montan en lugares distintos de src/routes/index.js:
//   authPublicRouter       /api/auth                       antes de authMiddleware
//   authPrivateRouter      /api/auth                       después de authMiddleware
//   funerariaCuentasRouter /api/funerarias/:funerariaId/cuentas
//   cuentasRouter          /api/cuentas
const express = require('express');
const { requireSuperAdmin } = require('../../../middleware/auth');
const { authLimiter } = require('../../../middleware/rateLimiter');
const cuentaController = require('../controllers/cuentaController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

// ----- Auth -----
const authPublicRouter = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login de una cuenta de funeraria
 * @access  Public (10 intentos cada 15 min por IP)
 */
authPublicRouter.post('/login', authLimiter, validate(schemas.login), cuentaController.login);

const authPrivateRouter = express.Router();

/**
 * @route   GET /api/auth/yo
 * @desc    Quién está logueado y de qué funeraria es
 * @access  Private
 */
authPrivateRouter.get('/yo', cuentaController.perfil);

/**
 * @route   PUT /api/auth/password
 * @desc    La cuenta de funeraria cambia su contraseña
 * @access  Private (solo cuentas de funeraria)
 */
authPrivateRouter.put('/password', validate(schemas.cambiarPassword), cuentaController.cambiarPassword);

// ----- Gestión de cuentas (solo superadmin) -----
const funerariaCuentasRouter = express.Router({ mergeParams: true });

/**
 * @route   GET /api/funerarias/:funerariaId/cuentas
 * @access  Superadmin
 */
funerariaCuentasRouter.get('/', requireSuperAdmin, validateObjectId('funerariaId'), cuentaController.listar);

/**
 * @route   POST /api/funerarias/:funerariaId/cuentas
 * @access  Superadmin
 * @body    { nombre, email, password }
 */
funerariaCuentasRouter.post(
  '/',
  requireSuperAdmin,
  validateObjectId('funerariaId'),
  validate(schemas.cuentaCrear),
  cuentaController.crear
);

const cuentasRouter = express.Router();

/**
 * @route   PUT /api/cuentas/:id
 * @access  Superadmin
 * @body    { nombre?, isActive? }
 */
cuentasRouter.put(
  '/:id',
  requireSuperAdmin,
  validateObjectId('id'),
  validate(schemas.cuentaActualizar),
  cuentaController.actualizar
);

/**
 * @route   DELETE /api/cuentas/:id
 * @desc    Eliminar la cuenta (corta su sesión)
 * @access  Superadmin
 */
cuentasRouter.delete('/:id', requireSuperAdmin, validateObjectId('id'), cuentaController.eliminar);

/**
 * @route   POST /api/cuentas/:id/password
 * @access  Superadmin
 * @body    { password }
 */
cuentasRouter.post(
  '/:id/password',
  requireSuperAdmin,
  validateObjectId('id'),
  validate(schemas.cuentaPassword),
  cuentaController.restablecerPassword
);

module.exports = { authPublicRouter, authPrivateRouter, funerariaCuentasRouter, cuentasRouter };

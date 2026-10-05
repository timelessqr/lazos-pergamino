// ===================================
// src/modules/usuarios/routes/usuarioRoutes.js
//
// Aquí NO hay login: core-qr emite el token. Estas rutas solo gestionan
// qué usuario de core-qr tiene acceso a esta plataforma y con qué rol.
// ===================================
// El token lo exige authMiddleware en src/routes/index.js. Aquí va el
// aislamiento entre funerarias de cada ruta.
const express = require('express');
const { requireSuperAdmin, scopeFuneraria } = require('../../../middleware/auth');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

/**
 * @route   POST /api/usuarios
 * @desc    Dar acceso a un usuario de core-qr (rol + funeraria)
 * @access  Superadmin
 * @body    { coreUserId, nombre?, email?, rol?, funerariaId? }
 */
router.post('/', requireSuperAdmin, validate(schemas.usuarioAcceso), usuarioController.registrarAcceso);

/**
 * @route   GET /api/usuarios
 * @desc    Listar los usuarios con acceso a la plataforma
 * @access  Superadmin
 * @query   rol
 */
router.get('/', requireSuperAdmin, usuarioController.getAll);

/**
 * @route   GET /api/usuarios/funeraria/:funerariaId
 * @desc    Listar los usuarios de una funeraria
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get(
  '/funeraria/:funerariaId',
  scopeFuneraria,
  validateObjectId('funerariaId'),
  usuarioController.getByFuneraria
);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Cambiar el rol o la funeraria de un usuario
 * @access  Superadmin
 */
router.put(
  '/:id',
  requireSuperAdmin,
  validateObjectId('id'),
  validate(schemas.usuarioUpdate),
  usuarioController.update
);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por su ID local
 * @access  Private (superadmin o la funeraria dueña)
 */
router.get('/:id', requireSuperAdmin, validateObjectId('id'), usuarioController.getById);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Revocar el acceso (no borra el usuario en core-qr)
 * @access  Superadmin
 */
router.delete('/:id', requireSuperAdmin, validateObjectId('id'), usuarioController.revocar);

module.exports = router;

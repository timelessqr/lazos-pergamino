// ===================================
// src/modules/usuarios/routes/usuarioRoutes.js
//
// Aquí NO hay login: core-qr emite el token. Estas rutas solo gestionan
// qué usuario de core-qr tiene acceso a esta plataforma y con qué rol.
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { validate, validateObjectId, schemas } = require('../../../middleware/validation');

/**
 * @route   POST /api/usuarios
 * @desc    Dar acceso a un usuario de core-qr (rol + funeraria)
 * @access  Abierto (era: Superadmin)
 * @body    { coreUserId, nombre?, email?, rol?, funerariaId? }
 */
router.post('/', validate(schemas.usuarioAcceso), usuarioController.registrarAcceso);

/**
 * @route   GET /api/usuarios
 * @desc    Listar los usuarios con acceso a la plataforma
 * @access  Abierto (era: Superadmin)
 * @query   rol
 */
router.get('/', usuarioController.getAll);

/**
 * @route   GET /api/usuarios/funeraria/:funerariaId
 * @desc    Listar los usuarios de una funeraria
 * @access  Abierto (era: Private)
 */
router.get(
  '/funeraria/:funerariaId',
  validateObjectId('funerariaId'),
  usuarioController.getByFuneraria
);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Cambiar el rol o la funeraria de un usuario
 * @access  Abierto (era: Superadmin)
 */
router.put(
  '/:id',
  validateObjectId('id'),
  validate(schemas.usuarioUpdate),
  usuarioController.update
);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por su ID local
 * @access  Abierto (era: Private)
 */
router.get('/:id', validateObjectId('id'), usuarioController.getById);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Revocar el acceso (no borra el usuario en core-qr)
 * @access  Abierto (era: Superadmin)
 */
router.delete('/:id', validateObjectId('id'), usuarioController.revocar);

module.exports = router;

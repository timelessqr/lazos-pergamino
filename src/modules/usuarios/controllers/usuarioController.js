// ===================================
// src/modules/usuarios/controllers/usuarioController.js
// ===================================
const usuarioService = require('../services/usuarioService');
const { responseHelper } = require('../../../utils/responseHelper');

class UsuarioController {
  /**
   * GET /api/usuarios/:id
   */
  async getById(req, res) {
    try {
      const usuario = await usuarioService.getPerfil(req.params.id);
      responseHelper.success(res, usuario, 'Usuario obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      responseHelper.error(res, error.message, 404);
    }
  }

  /**
   * POST /api/usuarios
   * Da acceso a un usuario de core-qr con un rol y una funeraria
   */
  async registrarAcceso(req, res) {
    try {
      const result = await usuarioService.registrarAcceso(req.body);
      responseHelper.success(res, result.usuario, result.message, 201);
    } catch (error) {
      console.error('Error registrando acceso:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/usuarios
   */
  async getAll(req, res) {
    try {
      const usuarios = await usuarioService.getUsuarios({ rol: req.query.rol });
      responseHelper.success(res, usuarios, 'Usuarios obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/usuarios/funeraria/:funerariaId
   */
  async getByFuneraria(req, res) {
    try {
      const usuarios = await usuarioService.getUsuariosByFuneraria(req.params.funerariaId);

      responseHelper.success(res, usuarios, 'Usuarios obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/usuarios/:id
   */
  async update(req, res) {
    try {
      const result = await usuarioService.actualizarUsuario(req.params.id, req.body);
      responseHelper.success(res, result.usuario, result.message);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/usuarios/:id
   */
  async revocar(req, res) {
    try {
      const result = await usuarioService.revocarAcceso(req.params.id);
      responseHelper.success(res, null, result.message);
    } catch (error) {
      console.error('Error revocando acceso:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new UsuarioController();

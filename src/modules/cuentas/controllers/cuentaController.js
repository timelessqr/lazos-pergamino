// ===================================
// src/modules/cuentas/controllers/cuentaController.js
// ===================================
const cuentaService = require('../services/cuentaService');
const { responseHelper } = require('../../../utils/responseHelper');

class CuentaController {
  // ============ AUTH ============

  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const result = await cuentaService.login(req.body.email, req.body.password);
      responseHelper.success(res, result, 'Sesión iniciada');
    } catch (error) {
      responseHelper.unauthorized(res, error.message);
    }
  }

  /**
   * GET /api/auth/yo
   */
  async perfil(req, res) {
    try {
      const result = await cuentaService.perfil(req.user);
      responseHelper.success(res, result, 'Perfil obtenido');
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/auth/password
   */
  async cambiarPassword(req, res) {
    try {
      if (req.user.tipo !== 'cuenta') {
        return responseHelper.forbidden(res, 'La contraseña de este usuario se cambia en core-qr');
      }

      const result = await cuentaService.cambiarPassword(req.user.id, req.body.actual, req.body.nueva);
      responseHelper.success(res, { token: result.token }, result.message);
    } catch (error) {
      responseHelper.error(res, error.message, 400);
    }
  }

  // ============ ADMIN ============

  /**
   * GET /api/funerarias/:funerariaId/cuentas
   */
  async listar(req, res) {
    try {
      const cuentas = await cuentaService.listar(req.params.funerariaId);
      responseHelper.success(res, cuentas, 'Cuentas obtenidas');
    } catch (error) {
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/funerarias/:funerariaId/cuentas
   */
  async crear(req, res) {
    try {
      const result = await cuentaService.crear(req.params.funerariaId, req.body);
      responseHelper.success(res, result.cuenta, result.message, 201);
    } catch (error) {
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/cuentas/:id
   */
  async actualizar(req, res) {
    try {
      const result = await cuentaService.actualizar(req.params.id, req.body);
      responseHelper.success(res, result.cuenta, result.message);
    } catch (error) {
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/cuentas/:id/password
   */
  async restablecerPassword(req, res) {
    try {
      const result = await cuentaService.restablecerPassword(req.params.id, req.body.password);
      responseHelper.success(res, null, result.message);
    } catch (error) {
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new CuentaController();

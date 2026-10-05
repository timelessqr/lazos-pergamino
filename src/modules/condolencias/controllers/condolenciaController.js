// ===================================
// src/modules/condolencias/controllers/condolenciaController.js
// ===================================
const condolenciaService = require('../services/condolenciaService');
const { responseHelper } = require('../../../utils/responseHelper');

class CondolenciaController {
  // ============ PUBLICO (via QR de la sala) ============

  /**
   * GET /api/pergamino/:code/condolencias/config
   */
  async getConfig(req, res) {
    try {
      const config = await condolenciaService.getConfigPublica(req.params.code);
      responseHelper.success(res, config, 'Configuración obtenida');
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * POST /api/pergamino/:code/condolencias/validar-codigo
   */
  async validarCodigo(req, res) {
    try {
      const result = await condolenciaService.validarCodigoAcceso(req.params.code, req.body.codigo);
      responseHelper.success(res, { valido: true, salaId: result.salaId }, result.message);
    } catch (error) {
      console.error('Error validando código:', error);
      responseHelper.error(res, error.message, 401);
    }
  }

  /**
   * POST /api/pergamino/:code/condolencias
   */
  async crear(req, res) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await condolenciaService.crearCondolencia(req.params.code, req.body, {
        ip,
        userAgent,
        codigoAcceso: req.headers['x-codigo-acceso']
      });

      responseHelper.success(res, result.condolencia, result.message, 201);
    } catch (error) {
      console.error('Error creando condolencia:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/pergamino/:code/condolencias
   */
  async getPublicas(req, res) {
    try {
      const result = await condolenciaService.getCondolenciasPublicas(req.params.code, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      });

      responseHelper.success(res, result, 'Condolencias obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo condolencias:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  // ============ ADMIN ============

  /**
   * GET /api/condolencias/sala/:salaId
   */
  async getBySala(req, res) {
    try {
      const result = await condolenciaService.getCondolenciasBySala(req.params.salaId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        estado: req.query.estado
      });

      responseHelper.success(res, result, 'Condolencias obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo condolencias:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/condolencias/sala/:salaId/search?q=termino
   */
  async search(req, res) {
    try {
      const condolencias = await condolenciaService.buscarCondolencias(
        req.params.salaId,
        req.query.q,
        parseInt(req.query.limit) || 20
      );

      responseHelper.success(res, condolencias, 'Búsqueda completada');
    } catch (error) {
      console.error('Error buscando condolencias:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/condolencias/sala/:salaId/stats
   */
  async getStats(req, res) {
    try {
      const stats = await condolenciaService.getStats(req.params.salaId);
      responseHelper.success(res, stats, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/condolencias/:id/moderar
   */
  async moderar(req, res) {
    try {
      const result = await condolenciaService.moderar(req.params.id, req.body.estado);
      responseHelper.success(res, result.condolencia, result.message);
    } catch (error) {
      console.error('Error moderando condolencia:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/condolencias/:id
   */
  async eliminar(req, res) {
    try {
      const result = await condolenciaService.eliminar(req.params.id);
      responseHelper.success(res, null, result.message);
    } catch (error) {
      console.error('Error eliminando condolencia:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new CondolenciaController();

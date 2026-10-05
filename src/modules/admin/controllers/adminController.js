// ===================================
// src/modules/admin/controllers/adminController.js
// ===================================
const adminService = require('../services/adminService');
const { responseHelper } = require('../../../utils/responseHelper');

class AdminController {
  /**
   * POST /api/admin/register-complete
   * Crea funeraria + 4 salas + 4 QR + 4 pergaminos + usuario
   */
  async registerComplete(req, res) {
    try {
      const result = await adminService.registrarFunerariaCompleta(req.body);

      responseHelper.success(
        res,
        { funeraria: result.funeraria, salas: result.salas, usuario: result.usuario },
        result.message,
        201
      );
    } catch (error) {
      console.error('Error en registro completo:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/admin/funerarias/:funerariaId/resumen
   */
  async getResumen(req, res) {
    try {
      const resumen = await adminService.getResumenFuneraria(req.params.funerariaId);
      responseHelper.success(res, resumen, 'Resumen obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/admin/funerarias/:funerariaId/qr/generar
   */
  async generarQRs(req, res) {
    try {
      const result = await adminService.generarImagenesQR(req.params.funerariaId);
      responseHelper.success(res, result.qrs, result.message);
    } catch (error) {
      console.error('Error generando QRs:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/admin/search?q=termino
   */
  async search(req, res) {
    try {
      const result = await adminService.buscar(req.query.q, parseInt(req.query.limit) || 10);
      responseHelper.success(res, result, 'Búsqueda completada');
    } catch (error) {
      console.error('Error en búsqueda:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/admin/metrics
   */
  async getMetrics(req, res) {
    try {
      const metricas = await adminService.getMetricas();
      responseHelper.success(res, metricas, 'Métricas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/admin/health
   */
  async getHealth(req, res) {
    try {
      const health = await adminService.getHealth();
      responseHelper.success(res, health, 'Sistema operativo');
    } catch (error) {
      console.error('Error obteniendo health:', error);
      responseHelper.error(res, error.message, 500);
    }
  }
}

module.exports = new AdminController();

// ===================================
// src/modules/dashboard/controllers/dashboardController.js
// ===================================
const dashboardService = require('../services/dashboardService');
const { responseHelper } = require('../../../utils/responseHelper');

class DashboardController {
  /**
   * GET /api/dashboard
   * Dashboard global de la plataforma.
   * (Mientras no haya autenticación no se puede deducir el rol del solicitante,
   * así que se devuelve el global; para el de una funeraria usa
   * GET /api/dashboard/funeraria/:funerariaId)
   */
  async get(req, res) {
    try {
      const dashboard = await dashboardService.getDashboardGlobal();
      responseHelper.success(res, dashboard, 'Dashboard obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo dashboard:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/dashboard/global
   */
  async getGlobal(req, res) {
    try {
      const dashboard = await dashboardService.getDashboardGlobal();
      responseHelper.success(res, dashboard, 'Dashboard global obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo dashboard global:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/dashboard/funeraria/:funerariaId
   */
  async getFuneraria(req, res) {
    try {
      const dashboard = await dashboardService.getDashboardFuneraria(req.params.funerariaId);

      responseHelper.success(res, dashboard, 'Dashboard obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo dashboard:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new DashboardController();

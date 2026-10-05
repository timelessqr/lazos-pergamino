// ===================================
// src/modules/salas/controllers/salaController.js
// ===================================
const salaService = require('../services/salaService');
const { responseHelper } = require('../../../utils/responseHelper');

class SalaController {
  /**
   * GET /api/funerarias/:funerariaId/salas
   */
  async getByFuneraria(req, res) {
    try {
      const salas = await salaService.getSalasByFuneraria(req.params.funerariaId, {
        soloActivas: req.query.activas === 'true'
      });

      responseHelper.success(res, salas, 'Salas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo salas:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/salas/:id
   */
  async getById(req, res) {
    try {
      const sala = await salaService.getSalaById(req.params.id);
      responseHelper.success(res, sala, 'Sala obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo sala:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * GET /api/funerarias/:funerariaId/salas/numero/:numero
   */
  async getByNumero(req, res) {
    try {
      const sala = await salaService.getSalaByNumero(req.params.funerariaId, req.params.numero);

      responseHelper.success(res, sala, 'Sala obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo sala:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * PUT /api/salas/:id
   */
  async update(req, res) {
    try {
      const result = await salaService.updateSala(req.params.id, req.body);
      responseHelper.success(res, result.sala, result.message);
    } catch (error) {
      console.error('Error actualizando sala:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/salas/:id/libro-condolencias
   */
  async updateLibroConfig(req, res) {
    try {
      const result = await salaService.updateLibroConfig(req.params.id, req.body);
      responseHelper.success(res, result.libroCondolencias, result.message);
    } catch (error) {
      console.error('Error configurando libro:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/salas/:id/libro-condolencias/codigo
   */
  async regenerarCodigo(req, res) {
    try {
      const result = await salaService.regenerarCodigoAcceso(req.params.id);
      responseHelper.success(res, { codigoAcceso: result.codigoAcceso }, result.message);
    } catch (error) {
      console.error('Error generando código:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new SalaController();

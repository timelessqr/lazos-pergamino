// ===================================
// src/modules/pergaminos/controllers/pergaminoController.js
// ===================================
const pergaminoService = require('../services/pergaminoService');
const { responseHelper } = require('../../../utils/responseHelper');

class PergaminoController {
  /**
   * GET /api/pergaminos/opciones
   */
  async getOpciones(req, res) {
    try {
      const opciones = pergaminoService.getOpcionesEditor();
      responseHelper.success(res, opciones, 'Opciones del editor obtenidas');
    } catch (error) {
      console.error('Error obteniendo opciones:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/pergaminos/sala/:salaId
   */
  async getBySala(req, res) {
    try {
      const pergamino = await pergaminoService.getPergaminoBySala(req.params.salaId);
      responseHelper.success(res, pergamino, 'Pergamino obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo pergamino:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * GET /api/pergaminos/funeraria/:funerariaId
   */
  async getByFuneraria(req, res) {
    try {
      const pergaminos = await pergaminoService.getPergaminosByFuneraria(req.params.funerariaId, {
        estado: req.query.estado
      });

      responseHelper.success(res, pergaminos, 'Pergaminos obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo pergaminos:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/pergaminos/:id
   */
  async getById(req, res) {
    try {
      const pergamino = await pergaminoService.getPergaminoById(req.params.id);
      responseHelper.success(res, pergamino, 'Pergamino obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo pergamino:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * PUT /api/pergaminos/:id
   */
  async update(req, res) {
    try {
      const result = await pergaminoService.updatePergamino(req.params.id, req.body);
      responseHelper.success(res, result.pergamino, result.message);
    } catch (error) {
      console.error('Error actualizando pergamino:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/pergaminos/:id/servicios
   */
  async addServicio(req, res) {
    try {
      const result = await pergaminoService.addServicio(req.params.id, req.body);
      responseHelper.success(res, result.servicios, result.message, 201);
    } catch (error) {
      console.error('Error agregando servicio:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/pergaminos/:id/servicios/:servicioId
   */
  async updateServicio(req, res) {
    try {
      const result = await pergaminoService.updateServicio(
        req.params.id,
        req.params.servicioId,
        req.body
      );

      responseHelper.success(res, result.servicios, result.message);
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/pergaminos/:id/servicios/:servicioId
   */
  async removeServicio(req, res) {
    try {
      const result = await pergaminoService.removeServicio(req.params.id, req.params.servicioId);
      responseHelper.success(res, result.servicios, result.message);
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/pergaminos/:id/servicios/reorder
   */
  async reorderServicios(req, res) {
    try {
      const result = await pergaminoService.reorderServicios(req.params.id, req.body.orden);
      responseHelper.success(res, result.servicios, result.message);
    } catch (error) {
      console.error('Error reordenando servicios:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/pergaminos/:id/publicar
   */
  async publicar(req, res) {
    try {
      const result = await pergaminoService.publicar(req.params.id);
      responseHelper.success(res, result.pergamino, result.message);
    } catch (error) {
      console.error('Error publicando pergamino:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/pergaminos/:id/archivar
   */
  async archivar(req, res) {
    try {
      const result = await pergaminoService.archivar(req.params.id);
      responseHelper.success(res, result.pergamino, result.message);
    } catch (error) {
      console.error('Error archivando pergamino:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/pergaminos/:id/reiniciar
   */
  async reiniciar(req, res) {
    try {
      const result = await pergaminoService.reiniciar(req.params.id);
      responseHelper.success(res, result.pergamino, result.message);
    } catch (error) {
      console.error('Error reiniciando pergamino:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new PergaminoController();

// ===================================
// src/modules/media/controllers/mediaController.js
// ===================================
const mediaService = require('../services/mediaService');
const { responseHelper } = require('../../../utils/responseHelper');

class MediaController {
  /**
   * POST /api/media/upload/:salaId
   */
  async upload(req, res) {
    try {
      if (!req.file) {
        return responseHelper.error(res, 'No se proporcionó archivo', 400);
      }

      const result = await mediaService.uploadFoto(
        req.params.salaId,
        req.file,
        {
          tipo: req.body.tipo,
          seccion: req.body.seccion,
          titulo: req.body.titulo,
          descripcion: req.body.descripcion,
          tags: req.body.tags ? String(req.body.tags).split(',').map(t => t.trim()) : []
        }
      );

      responseHelper.success(res, result.media, result.message, 201);
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/media/sala/:salaId
   */
  async getBySala(req, res) {
    try {
      const media = await mediaService.getMediaBySala(req.params.salaId, {
        seccion: req.query.seccion
      });

      responseHelper.success(res, media, 'Archivos obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo archivos:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/media/:id
   */
  async update(req, res) {
    try {
      const result = await mediaService.updateMedia(req.params.id, req.body);
      responseHelper.success(res, result.media, result.message);
    } catch (error) {
      console.error('Error actualizando archivo:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/media/:id
   */
  async delete(req, res) {
    try {
      const result = await mediaService.deleteMedia(req.params.id);
      responseHelper.success(res, null, result.message);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/media/reorder/:salaId
   */
  async reorder(req, res) {
    try {
      const result = await mediaService.reorder(req.params.salaId, req.body.orden);
      responseHelper.success(res, null, result.message);
    } catch (error) {
      console.error('Error reordenando archivos:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/media/stats/:salaId
   */
  async getStats(req, res) {
    try {
      const stats = await mediaService.getStats(req.params.salaId);
      responseHelper.success(res, stats, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new MediaController();

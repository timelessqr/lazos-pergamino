// ===================================
// src/modules/funerarias/controllers/funerariaController.js
// ===================================
const funerariaService = require('../services/funerariaService');
const { responseHelper } = require('../../../utils/responseHelper');

class FunerariaController {
  /**
   * POST /api/funerarias
   * Registra la funeraria y crea sus 4 salas con QR y pergamino
   */
  async register(req, res) {
    try {
      const result = await funerariaService.registerFuneraria(req.body);

      responseHelper.success(
        res,
        { funeraria: result.funeraria, salas: result.salas },
        result.message,
        201
      );
    } catch (error) {
      console.error('Error registrando funeraria:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/funerarias
   */
  async getAll(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        sortBy: req.query.sortBy || 'fechaRegistro',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await funerariaService.getFunerarias(options);

      responseHelper.success(res, result, 'Funerarias obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo funerarias:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/funerarias/stats
   */
  async getStats(req, res) {
    try {
      const stats = await funerariaService.getStats();
      responseHelper.success(res, stats, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/funerarias/search?q=termino
   */
  async search(req, res) {
    try {
      const { q, limit } = req.query;

      if (!q) {
        return responseHelper.error(res, 'El término de búsqueda es requerido', 400);
      }

      const funerarias = await funerariaService.searchFunerarias(q, parseInt(limit) || 10);

      responseHelper.success(res, funerarias, 'Búsqueda completada');
    } catch (error) {
      console.error('Error buscando funerarias:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/funerarias/code/:codigo
   */
  async getByCode(req, res) {
    try {
      const funeraria = await funerariaService.getFunerariaByCode(req.params.codigo);
      responseHelper.success(res, funeraria, 'Funeraria obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo funeraria:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * GET /api/funerarias/:id
   */
  async getById(req, res) {
    try {
      const funeraria = await funerariaService.getFunerariaById(req.params.id);
      responseHelper.success(res, funeraria, 'Funeraria obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo funeraria:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * GET /api/funerarias/:id/completa
   * Funeraria + sus 4 salas con QR y pergamino
   */
  async getCompleta(req, res) {
    try {
      const result = await funerariaService.getFunerariaCompleta(req.params.id);
      responseHelper.success(res, result, 'Funeraria obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo funeraria completa:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * PUT /api/funerarias/:id
   */
  async update(req, res) {
    try {
      const result = await funerariaService.updateFuneraria(req.params.id, req.body);
      responseHelper.success(res, result.funeraria, result.message);
    } catch (error) {
      console.error('Error actualizando funeraria:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/funerarias/:id
   */
  async delete(req, res) {
    try {
      const result = await funerariaService.deleteFuneraria(req.params.id);
      responseHelper.success(res, null, result.message);
    } catch (error) {
      console.error('Error eliminando funeraria:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/funerarias/:id/marca
   */
  async actualizarMarca(req, res) {
    try {
      const result = await funerariaService.actualizarMarca(req.params.id, req.body);
      responseHelper.success(res, result, result.message);
    } catch (error) {
      console.error('Error actualizando la marca:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/funerarias/:id/logo
   */
  async subirLogo(req, res) {
    try {
      if (!req.file) {
        return responseHelper.error(res, 'No se proporcionó archivo', 400);
      }

      const result = await funerariaService.subirLogo(req.params.id, req.file);
      responseHelper.success(res, result, 'Logo subido y aplicado a los pergaminos', 201);
    } catch (error) {
      console.error('Error subiendo el logo:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new FunerariaController();

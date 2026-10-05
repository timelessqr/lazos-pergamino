// ===================================
// src/modules/test/controllers/testController.js
// ===================================
const testService = require('../services/testService');
const { responseHelper } = require('../../../utils/responseHelper');

class TestController {
  /**
   * GET /api/test/estado
   */
  async getEstado(req, res) {
    try {
      const estado = await testService.getEstado();
      responseHelper.success(res, estado, 'Estado del sistema');
    } catch (error) {
      console.error('Error obteniendo estado:', error);
      responseHelper.error(res, error.message, 500);
    }
  }

  /**
   * GET /api/test/integridad
   */
  async verificarIntegridad(req, res) {
    try {
      const result = await testService.verificarIntegridad();

      responseHelper.success(
        res,
        result,
        result.ok ? '✅ Todas las reglas del dominio se cumplen' : `⚠️ ${result.problemas.length} problemas detectados`
      );
    } catch (error) {
      console.error('Error verificando integridad:', error);
      responseHelper.error(res, error.message, 500);
    }
  }

  /**
   * POST /api/test/escenario
   */
  async crearEscenario(req, res) {
    try {
      const escenario = await testService.crearEscenario(req.body);
      responseHelper.success(res, escenario, 'Escenario de prueba creado', 201);
    } catch (error) {
      console.error('Error creando escenario:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/test/salas/:salaId/llenar
   */
  async llenarPergamino(req, res) {
    try {
      const publicar = req.body.publicar !== false;
      const pergamino = await testService.llenarPergamino(req.params.salaId, publicar);

      responseHelper.success(res, pergamino, `Pergamino relleno${publicar ? ' y publicado' : ''}`);
    } catch (error) {
      console.error('Error llenando pergamino:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * DELETE /api/test/limpiar
   */
  async limpiar(req, res) {
    try {
      const result = await testService.limpiarDatosPrueba();
      responseHelper.success(res, result, `${result.eliminadas} funerarias de prueba eliminadas`);
    } catch (error) {
      console.error('Error limpiando datos:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/test/coleccion/:nombre
   */
  async dumpColeccion(req, res) {
    try {
      const result = await testService.dumpColeccion(req.params.nombre, req.query.limit || 20);
      responseHelper.success(res, result, `Colección ${result.coleccion}`);
    } catch (error) {
      console.error('Error volcando colección:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/test/funerarias/:id/trazar
   */
  async trazarFuneraria(req, res) {
    try {
      const result = await testService.trazarFuneraria(req.params.id);
      responseHelper.success(res, result, 'Árbol de la funeraria');
    } catch (error) {
      console.error('Error trazando funeraria:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/test/qr
   */
  async listarQRs(req, res) {
    try {
      const qrs = await testService.listarQRs();
      responseHelper.success(res, qrs, `${qrs.length} QR en la base`);
    } catch (error) {
      console.error('Error listando QRs:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/test/escanear/:code
   */
  async simularEscaneo(req, res) {
    try {
      const result = await testService.simularEscaneo(req.params.code);
      responseHelper.success(res, result, 'Escaneo simulado');
    } catch (error) {
      console.error('Error simulando escaneo:', error);
      responseHelper.error(res, error.message, 404);
    }
  }
}

module.exports = new TestController();

// ===================================
// src/modules/qr/controllers/qrController.js
// ===================================
const qrService = require('../services/qrService');
const { responseHelper } = require('../../../utils/responseHelper');

class QRController {
  /**
   * GET /api/qr/funeraria/:funerariaId
   */
  async getByFuneraria(req, res) {
    try {
      const qrs = await qrService.getQRsByFuneraria(req.params.funerariaId);

      responseHelper.success(res, qrs, 'QRs obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo QRs:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/qr/sala/:salaId
   */
  async getBySala(req, res) {
    try {
      const qr = await qrService.getQRBySala(req.params.salaId);
      responseHelper.success(res, qr, 'QR obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo QR:', error);
      responseHelper.notFound(res, error.message);
    }
  }

  /**
   * GET /api/qr/:id/imagen
   * Devuelve el PNG del QR listo para imprimir
   */
  async downloadImagen(req, res) {
    try {
      const { buffer, code } = await qrService.generarImagenQR(req.params.id, {
        darkColor: req.query.dark,
        lightColor: req.query.light
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${code}.png"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error generando imagen QR:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/qr/:id/dataurl
   */
  async getDataURL(req, res) {
    try {
      const result = await qrService.getQRDataURL(req.params.id, {
        darkColor: req.query.dark,
        lightColor: req.query.light
      });

      responseHelper.success(res, result, 'QR generado exitosamente');
    } catch (error) {
      console.error('Error generando QR:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * POST /api/qr/:id/imagen
   * Genera la imagen y la persiste en el storage
   */
  async generarImagen(req, res) {
    try {
      const result = await qrService.generarYGuardarImagen(req.params.id);
      responseHelper.success(res, result.qr, result.message);
    } catch (error) {
      console.error('Error guardando imagen QR:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * PUT /api/qr/:id/estado
   */
  async setActive(req, res) {
    try {
      const result = await qrService.setActive(req.params.id, req.body.isActive === true);
      responseHelper.success(res, result.qr, result.message);
    } catch (error) {
      console.error('Error cambiando estado del QR:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/qr/:id/stats
   */
  async getStats(req, res) {
    try {
      const stats = await qrService.getStats(req.params.id);
      responseHelper.success(res, stats, 'Estadísticas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      responseHelper.error(res, error.message, 400);
    }
  }

  /**
   * GET /api/pergamino/:code
   * PUBLICO: alguien escanea el QR de la sala
   */
  async accederPergamino(req, res) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await qrService.accederPorCodigo(req.params.code, { ip, userAgent });

      responseHelper.success(res, result.pergamino, 'Pergamino obtenido exitosamente');
    } catch (error) {
      console.error('Error accediendo al pergamino:', error);
      responseHelper.notFound(res, error.message);
    }
  }
}

module.exports = new QRController();

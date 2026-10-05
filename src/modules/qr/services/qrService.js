// ===================================
// src/modules/qr/services/qrService.js
// ===================================
const qrRepository = require('../repositories/qrRepository');
const pergaminoService = require('../../pergaminos/services/pergaminoService');
const { qrImageGenerator } = require('../../../utils/qrImageGenerator');
const { storageService } = require('../../../services/storage/storageService');
const { MESSAGES } = require('../../../utils/constants');

class QRService {
  /**
   * Listar los QR de una funeraria (los 4 fijos, uno por sala)
   */
  async getQRsByFuneraria(funerariaId) {
    try {
      const qrs = await qrRepository.findByFuneraria(funerariaId);

      return qrs.map(qr => ({
        id: qr._id,
        code: qr.code,
        url: qr.url,
        imagenUrl: qr.imagenUrl,
        isActive: qr.isActive,
        sala: qr.salaId,
        estadisticas: {
          vistas: qr.estadisticas?.vistas || 0,
          escaneos: qr.estadisticas?.escaneos || 0,
          ultimaVisita: qr.estadisticas?.ultimaVisita
        }
      }));
    } catch (error) {
      throw new Error(`Error obteniendo QRs: ${error.message}`);
    }
  }

  /**
   * Obtener el QR de una sala
   */
  async getQRBySala(salaId) {
    try {
      const qr = await qrRepository.findBySala(salaId);
      return this.formatQR(qr);
    } catch (error) {
      throw new Error(`Error obteniendo QR: ${error.message}`);
    }
  }

  /**
   * Genera la imagen PNG del QR de una sala.
   * El codigo NO se regenera: el QR fisico impreso siempre apunta aqui.
   */
  async generarImagenQR(qrId, options = {}) {
    try {
      const qr = await qrRepository.findById(qrId);

      const buffer = await qrImageGenerator.generateCustomQRImage(qr.url, {
        darkColor: options.darkColor,
        lightColor: options.lightColor,
        logoBuffer: options.logoBuffer
      });

      return { buffer, code: qr.code, url: qr.url };
    } catch (error) {
      throw new Error(`Error generando imagen QR: ${error.message}`);
    }
  }

  /**
   * Genera la imagen del QR, la guarda en el storage y la deja en el QR
   */
  async generarYGuardarImagen(qrId, options = {}) {
    try {
      const { buffer, code } = await this.generarImagenQR(qrId, options);

      const archivo = await storageService.upload(buffer, {
        folder: 'qr',
        originalName: `${code}.png`,
        mimeType: 'image/png'
      });

      const qr = await qrRepository.updateImagen(qrId, archivo.url);

      return {
        qr: this.formatQR(qr),
        message: MESSAGES.SUCCESS.QR_GENERATED
      };
    } catch (error) {
      throw new Error(`Error guardando imagen QR: ${error.message}`);
    }
  }

  /**
   * Genera el QR como data URL (previsualizacion en el panel)
   */
  async getQRDataURL(qrId, options = {}) {
    try {
      const qr = await qrRepository.findById(qrId);
      const dataUrl = await qrImageGenerator.generateQRDataURL(qr.url, options);

      return { code: qr.code, url: qr.url, dataUrl };
    } catch (error) {
      throw new Error(`Error generando QR: ${error.message}`);
    }
  }

  /**
   * ACCESO PUBLICO: alguien escanea el QR de una sala.
   * Registra el escaneo y devuelve el pergamino publicado de esa sala.
   */
  async accederPorCodigo(code, metadata = {}) {
    try {
      const qr = await qrRepository.findByCode(code);

      if (!qr.isActive) {
        throw new Error(MESSAGES.ERROR.QR_INACTIVE);
      }

      await qrRepository.registrarEscaneo(qr._id, metadata.ip, metadata.userAgent);

      const pergamino = await pergaminoService.getPergaminoPublico(qr.salaId);

      return {
        code: qr.code,
        salaId: qr.salaId,
        pergamino
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Activar/desactivar un QR
   */
  async setActive(qrId, isActive) {
    try {
      const qr = await qrRepository.setActive(qrId, isActive);

      return {
        qr: this.formatQR(qr),
        message: isActive ? 'QR activado' : 'QR desactivado'
      };
    } catch (error) {
      throw new Error(`Error cambiando estado del QR: ${error.message}`);
    }
  }

  /**
   * Estadisticas de un QR
   */
  async getStats(qrId) {
    try {
      const qr = await qrRepository.findById(qrId);

      return {
        code: qr.code,
        vistas: qr.estadisticas.vistas,
        escaneos: qr.estadisticas.escaneos,
        ultimaVisita: qr.estadisticas.ultimaVisita,
        visitasRecientes: (qr.estadisticas.visitasUnicas || [])
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20)
          .map(visita => ({ timestamp: visita.timestamp, userAgent: visita.userAgent }))
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Estadisticas agregadas de los QR de una funeraria
   */
  async getStatsByFuneraria(funerariaId) {
    try {
      return await qrRepository.getStatsByFuneraria(funerariaId);
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Formatea el QR para exponerlo por la API
   */
  formatQR(qr) {
    return {
      id: qr._id,
      code: qr.code,
      url: qr.url,
      imagenUrl: qr.imagenUrl,
      tipo: qr.tipo,
      funerariaId: qr.funerariaId,
      salaId: qr.salaId,
      isActive: qr.isActive,
      estadisticas: {
        vistas: qr.estadisticas?.vistas || 0,
        escaneos: qr.estadisticas?.escaneos || 0,
        ultimaVisita: qr.estadisticas?.ultimaVisita
      }
    };
  }
}

module.exports = new QRService();

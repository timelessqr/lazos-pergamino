// ===================================
// src/modules/qr/repositories/qrRepository.js
// ===================================
const mongoose = require('mongoose');
const QR = require('../../../models/QR');

class QRRepository {
  /**
   * Crear QR
   */
  async create(qrData) {
    try {
      const qr = new QR(qrData);
      return await qr.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`Ya existe un QR con ese ${field}`);
      }
      throw error;
    }
  }

  /**
   * Obtener QR por ID
   */
  async findById(qrId) {
    if (!mongoose.isValidObjectId(qrId)) {
      throw new Error('ID de QR inválido');
    }

    const qr = await QR.findById(qrId);
    if (!qr) {
      throw new Error('Código QR no válido');
    }

    return qr;
  }

  /**
   * Obtener QR por su codigo impreso (entrada publica)
   */
  async findByCode(code) {
    const qr = await QR.findOne({ code: String(code).toUpperCase().trim() });
    if (!qr) {
      throw new Error('Código QR no válido');
    }

    return qr;
  }

  /**
   * Obtener QR por codigo con sala, pergamino y funeraria resueltos
   */
  async findByCodeComplete(code) {
    const qr = await QR.findOne({ code: String(code).toUpperCase().trim() })
      .populate('funerariaId', 'nombre codigo telefono email direccion branding')
      .populate({
        path: 'salaId',
        populate: { path: 'pergaminoId' }
      });

    if (!qr) {
      throw new Error('Código QR no válido');
    }

    return qr;
  }

  /**
   * Obtener el QR de una sala
   */
  async findBySala(salaId) {
    const qr = await QR.findOne({ salaId });
    if (!qr) {
      throw new Error('Esta sala no tiene QR asignado');
    }

    return qr;
  }

  /**
   * Listar los QR de una funeraria
   */
  async findByFuneraria(funerariaId) {
    return await QR.find({ funerariaId })
      .populate('salaId', 'numero nombre activa')
      .sort({ createdAt: 1 })
      .lean();
  }

  /**
   * Comprobar si un codigo ya esta en uso
   */
  async codeExists(code) {
    const count = await QR.countDocuments({ code: String(code).toUpperCase().trim() });
    return count > 0;
  }

  /**
   * Guardar la URL de la imagen generada
   */
  async updateImagen(qrId, imagenUrl) {
    return await QR.findByIdAndUpdate(qrId, { imagenUrl }, { new: true });
  }

  /**
   * Activar/desactivar un QR
   */
  async setActive(qrId, isActive) {
    const qr = await QR.findByIdAndUpdate(qrId, { isActive }, { new: true });
    if (!qr) {
      throw new Error('Código QR no válido');
    }

    return qr;
  }

  /**
   * Registrar un escaneo publico
   */
  async registrarEscaneo(qrId, ip, userAgent) {
    const qr = await QR.findById(qrId);
    if (!qr) {
      throw new Error('Código QR no válido');
    }

    return await qr.registrarEscaneo(ip, userAgent);
  }

  /**
   * Estadisticas agregadas de los QR de una funeraria
   */
  async getStatsByFuneraria(funerariaId) {
    const result = await QR.aggregate([
      { $match: { funerariaId: new mongoose.Types.ObjectId(funerariaId) } },
      {
        $group: {
          _id: null,
          totalQRs: { $sum: 1 },
          activos: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalVistas: { $sum: '$estadisticas.vistas' },
          totalEscaneos: { $sum: '$estadisticas.escaneos' }
        }
      }
    ]);

    return result.length > 0
      ? result[0]
      : { totalQRs: 0, activos: 0, totalVistas: 0, totalEscaneos: 0 };
  }

  /**
   * Eliminar los QR de una funeraria
   */
  async deleteByFuneraria(funerariaId) {
    return await QR.deleteMany({ funerariaId });
  }
}

module.exports = new QRRepository();

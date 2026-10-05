// ===================================
// src/modules/condolencias/repositories/condolenciaRepository.js
// ===================================
const mongoose = require('mongoose');
const Condolencia = require('../../../models/Condolencia');
const { CONDOLENCIA_STATUS } = require('../../../utils/constants');

class CondolenciaRepository {
  /**
   * Crear condolencia
   */
  async create(condolenciaData) {
    const condolencia = new Condolencia(condolenciaData);
    return await condolencia.save();
  }

  /**
   * Obtener condolencia por ID
   */
  async findById(condolenciaId) {
    if (!mongoose.isValidObjectId(condolenciaId)) {
      throw new Error('ID de condolencia inválido');
    }

    const condolencia = await Condolencia.findById(condolenciaId);
    if (!condolencia) {
      throw new Error('Condolencia no encontrada');
    }

    return condolencia;
  }

  /**
   * Listar las condolencias publicas (aprobadas) de una sala
   */
  async findPublicasBySala(salaId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query = { salaId, estado: CONDOLENCIA_STATUS.APROBADA };

    const [condolencias, total] = await Promise.all([
      Condolencia.find(query)
        .select('nombre relacion mensaje createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Condolencia.countDocuments(query)
    ]);

    return {
      condolencias,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Listar todas las condolencias de una sala (vista admin, incluye pendientes)
   */
  async findBySala(salaId, options = {}) {
    const { page = 1, limit = 20, estado } = options;
    const skip = (page - 1) * limit;

    const query = { salaId };
    if (estado) query.estado = estado;

    const [condolencias, total] = await Promise.all([
      Condolencia.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Condolencia.countDocuments(query)
    ]);

    return {
      condolencias,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Buscar condolencias por texto dentro de una sala
   */
  async search(salaId, termino, limit = 20) {
    const regex = new RegExp(termino, 'i');

    return await Condolencia.find({
      salaId,
      $or: [{ nombre: regex }, { mensaje: regex }, { relacion: regex }]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Moderar una condolencia
   */
  async moderar(condolenciaId, estado) {
    const condolencia = await this.findById(condolenciaId);

    if (estado === CONDOLENCIA_STATUS.APROBADA) return await condolencia.aprobar();
    if (estado === CONDOLENCIA_STATUS.RECHAZADA) return await condolencia.rechazar();

    condolencia.estado = estado;
    return await condolencia.save();
  }

  /**
   * Eliminar una condolencia
   */
  async delete(condolenciaId) {
    const condolencia = await Condolencia.findByIdAndDelete(condolenciaId);
    if (!condolencia) {
      throw new Error('Condolencia no encontrada');
    }

    return condolencia;
  }

  /**
   * Estadisticas del libro de una sala
   */
  async getStatsBySala(salaId) {
    const result = await Condolencia.aggregate([
      { $match: { salaId: new mongoose.Types.ObjectId(salaId) } },
      { $group: { _id: '$estado', count: { $sum: 1 } } }
    ]);

    const stats = { total: 0, aprobadas: 0, pendientes: 0, rechazadas: 0 };

    result.forEach(item => {
      stats.total += item.count;
      if (item._id === CONDOLENCIA_STATUS.APROBADA) stats.aprobadas = item.count;
      if (item._id === CONDOLENCIA_STATUS.PENDIENTE) stats.pendientes = item.count;
      if (item._id === CONDOLENCIA_STATUS.RECHAZADA) stats.rechazadas = item.count;
    });

    return stats;
  }

  /**
   * Contar mensajes de una funeraria
   */
  async countByFuneraria(funerariaId) {
    return await Condolencia.countDocuments({ funerariaId });
  }

  /**
   * Eliminar las condolencias de una funeraria
   */
  async deleteByFuneraria(funerariaId) {
    return await Condolencia.deleteMany({ funerariaId });
  }
}

module.exports = new CondolenciaRepository();

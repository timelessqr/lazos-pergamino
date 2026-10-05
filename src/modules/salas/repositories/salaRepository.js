// ===================================
// src/modules/salas/repositories/salaRepository.js
// ===================================
const mongoose = require('mongoose');
const Sala = require('../../../models/Sala');

class SalaRepository {
  /**
   * Crear sala
   */
  async create(salaData) {
    try {
      const sala = new Sala(salaData);
      return await sala.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Ya existe una sala con ese número en la funeraria');
      }
      throw error;
    }
  }

  /**
   * Crear varias salas de golpe (aprovisionamiento inicial)
   */
  async createMany(salasData) {
    return await Sala.insertMany(salasData);
  }

  /**
   * Obtener sala por ID
   */
  async findById(salaId) {
    if (!mongoose.isValidObjectId(salaId)) {
      throw new Error('ID de sala inválido');
    }

    const sala = await Sala.findById(salaId);
    if (!sala) {
      throw new Error('Sala no encontrada');
    }

    return sala;
  }

  /**
   * Obtener sala con su QR y pergamino
   */
  async findByIdComplete(salaId) {
    if (!mongoose.isValidObjectId(salaId)) {
      throw new Error('ID de sala inválido');
    }

    const sala = await Sala.findById(salaId)
      .populate('qrId')
      .populate('pergaminoId')
      .populate('funerariaId', 'nombre codigo telefono branding');

    if (!sala) {
      throw new Error('Sala no encontrada');
    }

    return sala;
  }

  /**
   * Listar las salas de una funeraria (siempre ordenadas 1..4)
   */
  async findByFuneraria(funerariaId, options = {}) {
    const { soloActivas = false } = options;

    const query = { funerariaId };
    if (soloActivas) query.activa = true;

    return await Sala.find(query)
      .sort({ numero: 1 })
      .populate('qrId', 'code url imagenUrl isActive estadisticas')
      .populate('pergaminoId', 'estado template difunto version ultimaEdicion')
      .lean();
  }

  /**
   * Obtener una sala por su numero dentro de la funeraria
   */
  async findByNumero(funerariaId, numero) {
    const sala = await Sala.findOne({ funerariaId, numero: parseInt(numero) });
    if (!sala) {
      throw new Error('Sala no encontrada');
    }

    return sala;
  }

  /**
   * Actualizar sala
   */
  async update(salaId, updateData) {
    if (!mongoose.isValidObjectId(salaId)) {
      throw new Error('ID de sala inválido');
    }

    const sala = await Sala.findByIdAndUpdate(salaId, updateData, { new: true, runValidators: true });
    if (!sala) {
      throw new Error('Sala no encontrada');
    }

    return sala;
  }

  /**
   * Vincular el QR y el pergamino recien creados a la sala
   */
  async linkRecursos(salaId, { qrId, pergaminoId }) {
    const update = {};
    if (qrId) update.qrId = qrId;
    if (pergaminoId) update.pergaminoId = pergaminoId;

    return await this.update(salaId, update);
  }

  /**
   * Actualizar la configuracion del libro de condolencias
   */
  async updateLibroConfig(salaId, config) {
    const sala = await this.findById(salaId);

    sala.libroCondolencias = { ...sala.libroCondolencias.toObject(), ...config };
    return await sala.save();
  }

  /**
   * Contar salas de una funeraria
   */
  async countByFuneraria(funerariaId) {
    return await Sala.countDocuments({ funerariaId });
  }

  /**
   * Eliminar todas las salas de una funeraria (usado al borrar en duro)
   */
  async deleteByFuneraria(funerariaId) {
    return await Sala.deleteMany({ funerariaId });
  }
}

module.exports = new SalaRepository();

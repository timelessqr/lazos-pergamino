// ===================================
// src/modules/pergaminos/repositories/pergaminoRepository.js
// ===================================
const mongoose = require('mongoose');
const Pergamino = require('../../../models/Pergamino');

class PergaminoRepository {
  /**
   * Crear pergamino
   */
  async create(pergaminoData) {
    try {
      const pergamino = new Pergamino(pergaminoData);
      return await pergamino.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Esta sala ya tiene un pergamino asignado');
      }
      throw error;
    }
  }

  /**
   * Obtener pergamino por ID
   */
  async findById(pergaminoId) {
    if (!mongoose.isValidObjectId(pergaminoId)) {
      throw new Error('ID de pergamino inválido');
    }

    const pergamino = await Pergamino.findById(pergaminoId);
    if (!pergamino) {
      throw new Error('Pergamino no encontrado');
    }

    return pergamino;
  }

  /**
   * Obtener el pergamino de una sala (relacion 1:1)
   */
  async findBySala(salaId) {
    const pergamino = await Pergamino.findOne({ salaId });
    if (!pergamino) {
      throw new Error('Pergamino no encontrado');
    }

    return pergamino;
  }

  /**
   * Obtener el pergamino de una sala con la funeraria resuelta (render publico)
   */
  async findBySalaComplete(salaId) {
    const pergamino = await Pergamino.findOne({ salaId })
      .populate('funerariaId', 'nombre codigo telefono email direccion ciudad branding')
      .populate('salaId', 'numero nombre libroCondolencias');

    if (!pergamino) {
      throw new Error('Pergamino no encontrado');
    }

    return pergamino;
  }

  /**
   * Listar los pergaminos de una funeraria
   */
  async findByFuneraria(funerariaId, options = {}) {
    const { estado } = options;

    const query = { funerariaId };
    if (estado) query.estado = estado;

    return await Pergamino.find(query)
      .populate('salaId', 'numero nombre')
      .sort({ ultimaEdicion: -1 })
      .lean();
  }

  /**
   * Actualizar el contenido del pergamino
   * (usa save() para que corra el pre-save que sube la version)
   */
  async update(pergaminoId, updateData) {
    const pergamino = await this.findById(pergaminoId);

    Object.keys(updateData).forEach(campo => {
      pergamino[campo] = updateData[campo];
    });

    return await pergamino.save();
  }

  /**
   * Añadir un bloque de servicio ("VELATORIO", "CEREMONIA RELIGIOSA", ...)
   */
  async addServicio(pergaminoId, servicioData) {
    const pergamino = await this.findById(pergaminoId);

    const orden = servicioData.orden !== undefined
      ? servicioData.orden
      : pergamino.servicios.length;

    pergamino.servicios.push({ ...servicioData, orden });

    return await pergamino.save();
  }

  /**
   * Actualizar un bloque de servicio concreto
   */
  async updateServicio(pergaminoId, servicioId, servicioData) {
    const pergamino = await this.findById(pergaminoId);
    const servicio = pergamino.servicios.id(servicioId);

    if (!servicio) {
      throw new Error('Servicio no encontrado en el pergamino');
    }

    Object.keys(servicioData).forEach(campo => {
      servicio[campo] = servicioData[campo];
    });

    pergamino.markModified('servicios');
    return await pergamino.save();
  }

  /**
   * Eliminar un bloque de servicio
   */
  async removeServicio(pergaminoId, servicioId) {
    const pergamino = await this.findById(pergaminoId);
    const servicio = pergamino.servicios.id(servicioId);

    if (!servicio) {
      throw new Error('Servicio no encontrado en el pergamino');
    }

    servicio.deleteOne();
    pergamino.markModified('servicios');

    return await pergamino.save();
  }

  /**
   * Reordenar los bloques de servicio
   */
  async reorderServicios(pergaminoId, ordenIds) {
    const pergamino = await this.findById(pergaminoId);

    ordenIds.forEach((servicioId, index) => {
      const servicio = pergamino.servicios.id(servicioId);
      if (servicio) servicio.orden = index;
    });

    pergamino.markModified('servicios');
    return await pergamino.save();
  }

  /**
   * Cambiar el estado del pergamino
   */
  async setEstado(pergaminoId, estado) {
    const pergamino = await this.findById(pergaminoId);

    if (estado === 'publicado') return await pergamino.publicar();
    if (estado === 'archivado') return await pergamino.archivar();

    pergamino.estado = estado;
    return await pergamino.save();
  }

  /**
   * Reiniciar el pergamino para una nueva ocupacion de la sala
   */
  async reiniciar(pergaminoId) {
    const pergamino = await this.findById(pergaminoId);

    return await pergamino.reiniciar();
  }

  /**
   * Eliminar los pergaminos de una funeraria
   */
  async deleteByFuneraria(funerariaId) {
    return await Pergamino.deleteMany({ funerariaId });
  }
}

module.exports = new PergaminoRepository();

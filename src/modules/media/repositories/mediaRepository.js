// ===================================
// src/modules/media/repositories/mediaRepository.js
// ===================================
const mongoose = require('mongoose');
const Media = require('../../../models/Media');

class MediaRepository {
  /**
   * Crear registro de archivo
   */
  async create(mediaData) {
    const media = new Media(mediaData);
    return await media.save();
  }

  /**
   * Obtener archivo por ID
   */
  async findById(mediaId) {
    if (!mongoose.isValidObjectId(mediaId)) {
      throw new Error('ID de archivo inválido');
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      throw new Error('Archivo no encontrado');
    }

    return media;
  }

  /**
   * Listar los archivos de una sala
   */
  async findBySala(salaId, options = {}) {
    const { seccion, soloActivos = true } = options;

    const query = { salaId };
    if (seccion) query.seccion = seccion;
    if (soloActivos) query.isActive = true;

    return await Media.find(query).sort({ seccion: 1, orden: 1 }).lean();
  }

  /**
   * Actualizar metadatos del archivo
   */
  async update(mediaId, updateData) {
    const media = await Media.findByIdAndUpdate(mediaId, updateData, {
      new: true,
      runValidators: true
    });

    if (!media) {
      throw new Error('Archivo no encontrado');
    }

    return media;
  }

  /**
   * Desactivar archivo (soft delete)
   */
  async softDelete(mediaId) {
    return await this.update(mediaId, { isActive: false });
  }

  /**
   * Eliminar registro definitivamente
   */
  async delete(mediaId) {
    const media = await Media.findByIdAndDelete(mediaId);
    if (!media) {
      throw new Error('Archivo no encontrado');
    }

    return media;
  }

  /**
   * Reordenar los archivos de una sala
   */
  async reorder(salaId, ordenIds) {
    const operaciones = ordenIds.map((mediaId, index) => ({
      updateOne: { filter: { _id: mediaId, salaId }, update: { orden: index } }
    }));

    return await Media.bulkWrite(operaciones);
  }

  /**
   * Contar archivos activos de una sala
   */
  async countBySala(salaId) {
    return await Media.countDocuments({ salaId, isActive: true });
  }

  /**
   * Almacenamiento usado por la sala
   */
  async getStorageUsage(salaId) {
    return await Media.storageUsadoPorSala(salaId);
  }

  /**
   * Eliminar los archivos de una funeraria
   */
  async deleteByFuneraria(funerariaId) {
    return await Media.deleteMany({ funerariaId });
  }
}

module.exports = new MediaRepository();

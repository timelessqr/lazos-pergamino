// ===================================
// src/modules/media/services/mediaService.js
// ===================================
const sharp = require('sharp');
const mediaRepository = require('../repositories/mediaRepository');
const salaRepository = require('../../salas/repositories/salaRepository');
const { storageService } = require('../../../services/storage/storageService');
const { SALA_LIMITS, MESSAGES } = require('../../../utils/constants');

class MediaService {
  /**
   * Sube una foto para el pergamino de una sala.
   * Comprime la imagen antes de guardarla.
   */
  async uploadFoto(salaId, file, metadata = {}) {
    try {
      const sala = await salaRepository.findById(salaId);

      await this.verificarLimites(salaId, file.size);

      const procesada = await this.procesarImagen(file.buffer);

      const archivo = await storageService.upload(procesada.buffer, {
        folder: `salas/${salaId}`,
        originalName: file.originalname,
        mimeType: 'image/webp'
      });

      const media = await mediaRepository.create({
        funerariaId: sala.funerariaId,
        salaId: sala._id,
        pergaminoId: sala.pergaminoId,
        tipo: metadata.tipo || 'foto',
        seccion: metadata.seccion || 'galeria_fotos',
        titulo: metadata.titulo,
        descripcion: metadata.descripcion,
        tags: metadata.tags,
        archivo: {
          ...archivo,
          extension: 'webp',
          ancho: procesada.ancho,
          alto: procesada.alto
        },
        orden: await mediaRepository.countBySala(salaId)
      });

      return {
        media: this.formatMedia(media),
        message: 'Archivo subido exitosamente'
      };
    } catch (error) {
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
  }

  /**
   * Comprime y normaliza la imagen a webp
   */
  async procesarImagen(buffer, maxAncho = 1600) {
    const imagen = sharp(buffer);
    const metadata = await imagen.metadata();

    const procesada = await imagen
      .resize({ width: Math.min(metadata.width || maxAncho, maxAncho), withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: procesada.data,
      ancho: procesada.info.width,
      alto: procesada.info.height
    };
  }

  /**
   * Comprueba que la sala no exceda sus limites de fotos y almacenamiento
   */
  async verificarLimites(salaId, tamanoNuevo = 0) {
    const [totalArchivos, uso] = await Promise.all([
      mediaRepository.countBySala(salaId),
      mediaRepository.getStorageUsage(salaId)
    ]);

    if (totalArchivos >= SALA_LIMITS.fotos) {
      throw new Error(`${MESSAGES.ERROR.SALA_LIMIT_REACHED}: máximo ${SALA_LIMITS.fotos} fotos`);
    }

    if (uso.bytes + tamanoNuevo > SALA_LIMITS.almacenamiento) {
      const maxMB = Math.floor(SALA_LIMITS.almacenamiento / (1024 * 1024));
      throw new Error(`${MESSAGES.ERROR.SALA_LIMIT_REACHED}: máximo ${maxMB}MB por sala`);
    }

    return true;
  }

  /**
   * Listar los archivos de una sala
   */
  async getMediaBySala(salaId, options = {}) {
    try {
      const media = await mediaRepository.findBySala(salaId, options);
      return media.map(item => this.formatMedia(item));
    } catch (error) {
      throw new Error(`Error obteniendo archivos: ${error.message}`);
    }
  }

  /**
   * Actualizar metadatos de un archivo
   */
  async updateMedia(mediaId, updateData) {
    try {
      const media = await mediaRepository.update(mediaId, updateData);

      return {
        media: this.formatMedia(media),
        message: 'Archivo actualizado exitosamente'
      };
    } catch (error) {
      throw new Error(`Error actualizando archivo: ${error.message}`);
    }
  }

  /**
   * Eliminar un archivo (del storage y de la BD)
   */
  async deleteMedia(mediaId) {
    try {
      const media = await mediaRepository.findById(mediaId);

      await storageService.delete(media.archivo.ruta).catch(err => {
        console.error('No se pudo borrar el archivo físico:', err.message);
      });

      await mediaRepository.delete(mediaId);

      return { message: 'Archivo eliminado exitosamente' };
    } catch (error) {
      throw new Error(`Error eliminando archivo: ${error.message}`);
    }
  }

  /**
   * Reordenar los archivos de una sala
   */
  async reorder(salaId, ordenIds) {
    try {
      if (!Array.isArray(ordenIds) || ordenIds.length === 0) {
        throw new Error('Se requiere el arreglo de IDs en el nuevo orden');
      }

      await mediaRepository.reorder(salaId, ordenIds);

      return { message: 'Archivos reordenados exitosamente' };
    } catch (error) {
      throw new Error(`Error reordenando archivos: ${error.message}`);
    }
  }

  /**
   * Uso de almacenamiento de la sala
   */
  async getStats(salaId) {
    try {
      const uso = await mediaRepository.getStorageUsage(salaId);

      return {
        archivos: uso.archivos,
        bytesUsados: uso.bytes,
        mbUsados: Math.round((uso.bytes / (1024 * 1024)) * 100) / 100,
        limiteArchivos: SALA_LIMITS.fotos,
        limiteMB: Math.floor(SALA_LIMITS.almacenamiento / (1024 * 1024)),
        porcentajeUsado: Math.round((uso.bytes / SALA_LIMITS.almacenamiento) * 100)
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Informacion del driver de almacenamiento activo
   */
  getStorageInfo() {
    return storageService.getInfo();
  }

  /**
   * Formatea el archivo para exponerlo por la API
   */
  formatMedia(media) {
    return {
      id: media._id,
      tipo: media.tipo,
      seccion: media.seccion,
      titulo: media.titulo,
      descripcion: media.descripcion,
      tags: media.tags,
      url: media.archivo?.url,
      thumbnailUrl: media.archivo?.thumbnailUrl,
      ancho: media.archivo?.ancho,
      alto: media.archivo?.alto,
      tamano: media.archivo?.tamano,
      orden: media.orden,
      createdAt: media.createdAt
    };
  }
}

module.exports = new MediaService();

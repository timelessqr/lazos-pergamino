// ===================================
// src/modules/salas/services/salaService.js
// ===================================
const salaRepository = require('../repositories/salaRepository');
const condolenciaRepository = require('../../condolencias/repositories/condolenciaRepository');
const { codeGenerator } = require('../../../utils/codeGenerator');
const { MESSAGES } = require('../../../utils/constants');

class SalaService {
  /**
   * Listar las salas de una funeraria (las 4 fijas)
   */
  async getSalasByFuneraria(funerariaId, options = {}) {
    try {
      const salas = await salaRepository.findByFuneraria(funerariaId, options);

      return salas.map(sala => this.formatSala(sala));
    } catch (error) {
      throw new Error(`Error obteniendo salas: ${error.message}`);
    }
  }

  /**
   * Obtener una sala con su QR y su pergamino
   */
  async getSalaById(salaId) {
    try {
      const sala = await salaRepository.findByIdComplete(salaId);
      const statsCondolencias = await condolenciaRepository.getStatsBySala(salaId);

      return {
        ...this.formatSala(sala),
        condolencias: statsCondolencias
      };
    } catch (error) {
      throw new Error(`Error obteniendo sala: ${error.message}`);
    }
  }

  /**
   * Obtener una sala por su numero dentro de la funeraria (1..4)
   */
  async getSalaByNumero(funerariaId, numero) {
    try {
      const sala = await salaRepository.findByNumero(funerariaId, numero);
      return await this.getSalaById(sala._id);
    } catch (error) {
      throw new Error(`Error obteniendo sala: ${error.message}`);
    }
  }

  /**
   * Actualizar los datos editables de la sala (nombre, capacidad, ubicacion...)
   */
  async updateSala(salaId, updateData) {
    try {
      const sala = await salaRepository.update(salaId, updateData);

      return {
        sala: this.formatSala(sala),
        message: MESSAGES.SUCCESS.SALA_UPDATED
      };
    } catch (error) {
      throw new Error(`Error actualizando sala: ${error.message}`);
    }
  }

  /**
   * Configurar el libro de condolencias de la sala
   */
  async updateLibroConfig(salaId, config) {
    try {
      // Si se exige codigo pero no se envia ninguno, generamos uno
      if (config.requiereCodigo && !config.codigoAcceso) {
        const sala = await salaRepository.findById(salaId);

        if (!sala.libroCondolencias.codigoAcceso) {
          config.codigoAcceso = codeGenerator.generateAccessCode(6);
        }
      }

      const sala = await salaRepository.updateLibroConfig(salaId, config);

      return {
        libroCondolencias: sala.libroCondolencias,
        message: 'Configuración del libro de condolencias actualizada'
      };
    } catch (error) {
      throw new Error(`Error configurando libro de condolencias: ${error.message}`);
    }
  }

  /**
   * Generar un nuevo codigo de acceso al libro de condolencias
   */
  async regenerarCodigoAcceso(salaId) {
    try {
      const codigoAcceso = codeGenerator.generateAccessCode(6);

      const sala = await salaRepository.updateLibroConfig(salaId, {
        requiereCodigo: true,
        codigoAcceso
      });

      return {
        codigoAcceso: sala.libroCondolencias.codigoAcceso,
        message: 'Código de acceso generado exitosamente'
      };
    } catch (error) {
      throw new Error(`Error generando código: ${error.message}`);
    }
  }

  /**
   * Verifica que la sala pertenezca a la funeraria indicada
   */
  async assertPerteneceAFuneraria(salaId, funerariaId) {
    const sala = await salaRepository.findById(salaId);

    if (String(sala.funerariaId) !== String(funerariaId)) {
      throw new Error(MESSAGES.ERROR.FORBIDDEN);
    }

    return sala;
  }

  /**
   * Formatea la sala para exponerla por la API
   */
  formatSala(sala) {
    const qr = sala.qrId;
    const pergamino = sala.pergaminoId;

    return {
      id: sala._id,
      numero: sala.numero,
      nombre: sala.nombre,
      descripcion: sala.descripcion,
      capacidad: sala.capacidad,
      ubicacion: sala.ubicacion,
      activa: sala.activa,
      funeraria: sala.funerariaId && sala.funerariaId.nombre
        ? { id: sala.funerariaId._id, nombre: sala.funerariaId.nombre, codigo: sala.funerariaId.codigo }
        : sala.funerariaId,
      qr: qr && qr.code
        ? {
            id: qr._id,
            code: qr.code,
            url: qr.url,
            imagenUrl: qr.imagenUrl,
            isActive: qr.isActive,
            estadisticas: qr.estadisticas
          }
        : null,
      pergamino: pergamino && pergamino._id
        ? {
            id: pergamino._id,
            estado: pergamino.estado,
            template: pergamino.template,
            difunto: pergamino.difunto,
            version: pergamino.version,
            ultimaEdicion: pergamino.ultimaEdicion
          }
        : null,
      libroCondolencias: sala.libroCondolencias
    };
  }
}

module.exports = new SalaService();

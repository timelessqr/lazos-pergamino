// ===================================
// src/modules/condolencias/services/condolenciaService.js
// ===================================
const condolenciaRepository = require('../repositories/condolenciaRepository');
const salaRepository = require('../../salas/repositories/salaRepository');
const qrRepository = require('../../qr/repositories/qrRepository');
const pergaminoRepository = require('../../pergaminos/repositories/pergaminoRepository');
const { validateCondolenciaData } = require('../../../utils/validators');
const { MESSAGES, CONDOLENCIA_STATUS } = require('../../../utils/constants');

class CondolenciaService {
  /**
   * Resuelve la sala a partir del codigo QR escaneado
   */
  async resolverSalaPorCodigo(code) {
    const qr = await qrRepository.findByCode(code);

    if (!qr.isActive) {
      throw new Error(MESSAGES.ERROR.QR_INACTIVE);
    }

    return await salaRepository.findById(qr.salaId);
  }

  /**
   * Servicio en curso de la sala: el libro muestra solo sus mensajes
   */
  async servicioActualDeSala(salaId) {
    const pergamino = await pergaminoRepository.findBySala(salaId);
    return pergamino.servicioActual || 1;
  }

  /**
   * PUBLICO: configuracion del libro de condolencias de la sala del QR
   */
  async getConfigPublica(code) {
    try {
      const sala = await this.resolverSalaPorCodigo(code);

      return {
        salaId: sala._id,
        salaNombre: sala.nombre,
        habilitado: sala.libroCondolencias.habilitado,
        requiereCodigo: sala.libroCondolencias.requiereCodigo,
        mensajeBienvenida: sala.libroCondolencias.mensajeBienvenida,
        totalMensajes: sala.libroCondolencias.totalMensajes
      };
    } catch (error) {
      throw new Error(`Error obteniendo configuración: ${error.message}`);
    }
  }

  /**
   * PUBLICO: valida el codigo de acceso al libro
   */
  async validarCodigoAcceso(code, codigoAcceso) {
    try {
      const sala = await this.resolverSalaPorCodigo(code);

      if (!sala.libroCondolencias.habilitado) {
        throw new Error(MESSAGES.ERROR.CONDOLENCIAS_CERRADAS);
      }

      const valido = sala.validarCodigoAcceso(codigoAcceso);
      if (!valido) {
        throw new Error(MESSAGES.ERROR.CODIGO_INVALIDO);
      }

      return { valido: true, salaId: sala._id, message: 'Código válido' };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * PUBLICO: deja un mensaje en el libro de condolencias de la sala
   */
  async crearCondolencia(code, condolenciaData, metadata = {}) {
    try {
      const { error, value } = validateCondolenciaData(condolenciaData);
      if (error) {
        throw new Error(error.details[0].message);
      }

      const sala = await this.resolverSalaPorCodigo(code);

      if (!sala.libroCondolencias.habilitado) {
        throw new Error(MESSAGES.ERROR.CONDOLENCIAS_CERRADAS);
      }

      if (sala.libroCondolencias.requiereCodigo) {
        const valido = sala.validarCodigoAcceso(condolenciaData.codigoAcceso || metadata.codigoAcceso);
        if (!valido) {
          throw new Error(MESSAGES.ERROR.CODIGO_INVALIDO);
        }
      }

      const pergamino = await pergaminoRepository.findBySala(sala._id);

      // El pergamino es editable y se sobrescribe: guardamos a quien iba dirigido
      const condolencia = await condolenciaRepository.create({
        ...value,
        funerariaId: sala.funerariaId,
        salaId: sala._id,
        pergaminoId: pergamino._id,
        servicio: pergamino.servicioActual || 1,
        difuntoSnapshot: {
          nombre: pergamino.difunto?.nombre,
          apellido: pergamino.difunto?.apellido
        },
        estado: sala.libroCondolencias.requiereModeracion
          ? CONDOLENCIA_STATUS.PENDIENTE
          : CONDOLENCIA_STATUS.APROBADA,
        metadata: { ip: metadata.ip, userAgent: metadata.userAgent }
      });

      await sala.incrementarMensajes();

      return {
        condolencia: this.formatPublica(condolencia),
        requiereModeracion: sala.libroCondolencias.requiereModeracion,
        message: sala.libroCondolencias.requiereModeracion
          ? 'Tu mensaje fue recibido y será publicado tras revisión'
          : MESSAGES.SUCCESS.CONDOLENCIA_CREATED
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * PUBLICO: mensajes visibles del libro de la sala
   */
  async getCondolenciasPublicas(code, options = {}) {
    try {
      const sala = await this.resolverSalaPorCodigo(code);
      const servicio = await this.servicioActualDeSala(sala._id);
      const result = await condolenciaRepository.findPublicasBySala(sala._id, servicio, options);

      return {
        condolencias: result.condolencias.map(condolencia => this.formatPublica(condolencia)),
        pagination: result.pagination
      };
    } catch (error) {
      throw new Error(`Error obteniendo condolencias: ${error.message}`);
    }
  }

  /**
   * ADMIN: todos los mensajes de una sala (incluye pendientes)
   */
  async getCondolenciasBySala(salaId, options = {}) {
    try {
      const servicio = await this.servicioActualDeSala(salaId);
      const result = await condolenciaRepository.findBySala(salaId, servicio, options);

      return {
        condolencias: result.condolencias,
        pagination: result.pagination
      };
    } catch (error) {
      throw new Error(`Error obteniendo condolencias: ${error.message}`);
    }
  }

  /**
   * ADMIN: buscar mensajes dentro del libro de una sala
   */
  async buscarCondolencias(salaId, termino, limit = 20) {
    try {
      if (!termino) {
        throw new Error('El término de búsqueda es requerido');
      }

      const servicio = await this.servicioActualDeSala(salaId);
      return await condolenciaRepository.search(salaId, servicio, termino, limit);
    } catch (error) {
      throw new Error(`Error buscando condolencias: ${error.message}`);
    }
  }

  /**
   * ADMIN: aprobar o rechazar un mensaje
   */
  async moderar(condolenciaId, estado) {
    try {
      const estadosValidos = Object.values(CONDOLENCIA_STATUS);
      if (!estadosValidos.includes(estado)) {
        throw new Error(`Estado inválido. Use: ${estadosValidos.join(', ')}`);
      }

      const condolencia = await condolenciaRepository.moderar(condolenciaId, estado);

      return {
        condolencia,
        message: estado === CONDOLENCIA_STATUS.APROBADA ? 'Mensaje aprobado' : 'Mensaje rechazado'
      };
    } catch (error) {
      throw new Error(`Error moderando condolencia: ${error.message}`);
    }
  }

  /**
   * ADMIN: eliminar un mensaje
   */
  async eliminar(condolenciaId) {
    try {
      const condolencia = await condolenciaRepository.delete(condolenciaId);

      // El contador solo cuenta el servicio en curso
      const sala = await salaRepository.findById(condolencia.salaId);
      const servicio = await this.servicioActualDeSala(condolencia.salaId);
      if (condolencia.servicio === servicio && sala.libroCondolencias.totalMensajes > 0) {
        sala.libroCondolencias.totalMensajes -= 1;
        await sala.save();
      }

      return { message: 'Condolencia eliminada exitosamente' };
    } catch (error) {
      throw new Error(`Error eliminando condolencia: ${error.message}`);
    }
  }

  /**
   * ADMIN: estadisticas del libro de una sala
   */
  async getStats(salaId) {
    try {
      const servicio = await this.servicioActualDeSala(salaId);
      return await condolenciaRepository.getStatsBySala(salaId, servicio);
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Formatea el mensaje para el visitante (sin datos sensibles)
   */
  formatPublica(condolencia) {
    return {
      id: condolencia._id,
      nombre: condolencia.nombre,
      relacion: condolencia.relacion,
      mensaje: condolencia.mensaje,
      fecha: condolencia.createdAt
    };
  }
}

module.exports = new CondolenciaService();

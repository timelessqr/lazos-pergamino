// ===================================
// src/modules/pergaminos/services/pergaminoService.js
// ===================================
const pergaminoRepository = require('../repositories/pergaminoRepository');
const salaRepository = require('../../salas/repositories/salaRepository');
const { validatePergaminoData } = require('../../../utils/validators');
const { MESSAGES, PERGAMINO_TEMPLATES, TIPOS_SERVICIO, ICONOS_SERVICIO } = require('../../../utils/constants');

class PergaminoService {
  /**
   * Obtener el pergamino de una sala (vista de edicion)
   */
  async getPergaminoBySala(salaId) {
    try {
      const pergamino = await pergaminoRepository.findBySala(salaId);
      return this.formatPergamino(pergamino);
    } catch (error) {
      throw new Error(`Error obteniendo pergamino: ${error.message}`);
    }
  }

  /**
   * Obtener pergamino por ID
   */
  async getPergaminoById(pergaminoId) {
    try {
      const pergamino = await pergaminoRepository.findById(pergaminoId);
      return this.formatPergamino(pergamino);
    } catch (error) {
      throw new Error(`Error obteniendo pergamino: ${error.message}`);
    }
  }

  /**
   * Listar los pergaminos de una funeraria
   */
  async getPergaminosByFuneraria(funerariaId, options = {}) {
    try {
      const pergaminos = await pergaminoRepository.findByFuneraria(funerariaId, options);

      return pergaminos.map(pergamino => ({
        id: pergamino._id,
        sala: pergamino.salaId,
        estado: pergamino.estado,
        template: pergamino.template,
        difunto: pergamino.difunto,
        version: pergamino.version,
        ultimaEdicion: pergamino.ultimaEdicion
      }));
    } catch (error) {
      throw new Error(`Error obteniendo pergaminos: ${error.message}`);
    }
  }

  /**
   * Actualizar el contenido del pergamino (nombre, foto, fechas, frase, servicios...)
   */
  async updatePergamino(pergaminoId, updateData) {
    try {
      const { error, value } = validatePergaminoData(updateData);
      if (error) {
        throw new Error(error.details[0].message);
      }

      const pergamino = await pergaminoRepository.update(pergaminoId, value);

      return {
        pergamino: this.formatPergamino(pergamino),
        message: MESSAGES.SUCCESS.PERGAMINO_UPDATED
      };
    } catch (error) {
      throw new Error(`Error actualizando pergamino: ${error.message}`);
    }
  }

  /**
   * Añadir un bloque a "INFORMACION DEL SERVICIO"
   */
  async addServicio(pergaminoId, servicioData) {
    try {
      const pergamino = await pergaminoRepository.addServicio(pergaminoId, servicioData);

      return {
        servicios: pergamino.serviciosVisibles(),
        message: 'Servicio agregado al pergamino'
      };
    } catch (error) {
      throw new Error(`Error agregando servicio: ${error.message}`);
    }
  }

  /**
   * Actualizar un bloque de servicio
   */
  async updateServicio(pergaminoId, servicioId, servicioData) {
    try {
      const pergamino = await pergaminoRepository.updateServicio(pergaminoId, servicioId, servicioData);

      return {
        servicios: pergamino.serviciosVisibles(),
        message: 'Servicio actualizado'
      };
    } catch (error) {
      throw new Error(`Error actualizando servicio: ${error.message}`);
    }
  }

  /**
   * Eliminar un bloque de servicio
   */
  async removeServicio(pergaminoId, servicioId) {
    try {
      const pergamino = await pergaminoRepository.removeServicio(pergaminoId, servicioId);

      return {
        servicios: pergamino.serviciosVisibles(),
        message: 'Servicio eliminado'
      };
    } catch (error) {
      throw new Error(`Error eliminando servicio: ${error.message}`);
    }
  }

  /**
   * Reordenar los bloques de servicio
   */
  async reorderServicios(pergaminoId, ordenIds) {
    try {
      if (!Array.isArray(ordenIds) || ordenIds.length === 0) {
        throw new Error('Se requiere el arreglo de IDs en el nuevo orden');
      }

      const pergamino = await pergaminoRepository.reorderServicios(pergaminoId, ordenIds);

      return {
        servicios: pergamino.serviciosVisibles(),
        message: 'Servicios reordenados'
      };
    } catch (error) {
      throw new Error(`Error reordenando servicios: ${error.message}`);
    }
  }

  /**
   * Publicar el pergamino (lo hace visible al escanear el QR)
   */
  async publicar(pergaminoId) {
    try {
      const pergamino = await pergaminoRepository.setEstado(pergaminoId, 'publicado');

      return {
        pergamino: this.formatPergamino(pergamino),
        message: MESSAGES.SUCCESS.PERGAMINO_PUBLISHED
      };
    } catch (error) {
      throw new Error(`Error publicando pergamino: ${error.message}`);
    }
  }

  /**
   * Archivar el pergamino (fin del velatorio)
   */
  async archivar(pergaminoId) {
    try {
      const pergamino = await pergaminoRepository.setEstado(pergaminoId, 'archivado');

      return {
        pergamino: this.formatPergamino(pergamino),
        message: 'Pergamino archivado'
      };
    } catch (error) {
      throw new Error(`Error archivando pergamino: ${error.message}`);
    }
  }

  /**
   * Reiniciar el pergamino: la sala queda lista para el siguiente velatorio.
   * El QR NO cambia, sigue siendo el mismo QR fijo impreso.
   */
  async reiniciar(pergaminoId) {
    try {
      const pergamino = await pergaminoRepository.reiniciar(pergaminoId);

      // Los mensajes del servicio anterior quedan guardados pero fuera del libro
      const sala = await salaRepository.findById(pergamino.salaId);
      await sala.reiniciarMensajes();

      return {
        pergamino: this.formatPergamino(pergamino),
        message: 'Pergamino reiniciado, la sala está lista para un nuevo servicio'
      };
    } catch (error) {
      throw new Error(`Error reiniciando pergamino: ${error.message}`);
    }
  }

  /**
   * Vista publica del pergamino: lo que se ve al escanear el QR de la sala
   */
  async getPergaminoPublico(salaId) {
    try {
      const pergamino = await pergaminoRepository.findBySalaComplete(salaId);

      if (pergamino.estado === 'borrador') {
        throw new Error('Este pergamino aún no está publicado');
      }

      return this.formatPergaminoPublico(pergamino);
    } catch (error) {
      throw new Error(`Error obteniendo pergamino: ${error.message}`);
    }
  }

  /**
   * Catalogo para el editor del frontend: plantillas, tipos e iconos
   */
  getOpcionesEditor() {
    return {
      templates: Object.values(PERGAMINO_TEMPLATES),
      tiposServicio: TIPOS_SERVICIO,
      iconos: ICONOS_SERVICIO,
      marcosFoto: ['ovalo', 'circulo', 'rectangulo']
    };
  }

  /**
   * Verifica que el pergamino pertenezca a la funeraria indicada
   */
  async assertPerteneceAFuneraria(pergaminoId, funerariaId) {
    const pergamino = await pergaminoRepository.findById(pergaminoId);

    if (String(pergamino.funerariaId) !== String(funerariaId)) {
      throw new Error(MESSAGES.ERROR.FORBIDDEN);
    }

    return pergamino;
  }

  /**
   * Formatea el pergamino completo (vista de edicion)
   */
  formatPergamino(pergamino) {
    return {
      id: pergamino._id,
      funerariaId: pergamino.funerariaId,
      salaId: pergamino.salaId,
      template: pergamino.template,
      encabezado: pergamino.encabezado,
      difunto: pergamino.difunto,
      nombreCompletoDifunto: pergamino.nombreCompletoDifunto,
      frase: pergamino.frase,
      serviciosTitulo: pergamino.serviciosTitulo,
      servicios: pergamino.servicios,
      pie: pergamino.pie,
      mensaje: pergamino.mensaje,
      oracion: pergamino.oracion,
      secciones: pergamino.secciones,
      estilos: pergamino.estilos,
      estado: pergamino.estado,
      version: pergamino.version,
      ultimaEdicion: pergamino.ultimaEdicion,
      fechaPublicacion: pergamino.fechaPublicacion
    };
  }

  /**
   * Formatea el pergamino para el visitante que escanea el QR
   */
  formatPergaminoPublico(pergamino) {
    const funeraria = pergamino.funerariaId;
    const sala = pergamino.salaId;

    return {
      template: pergamino.template,
      encabezado: pergamino.encabezado,
      difunto: {
        nombre: pergamino.difunto?.nombre,
        apellido: pergamino.difunto?.apellido,
        nombreCompleto: pergamino.nombreCompletoDifunto,
        fechaNacimiento: pergamino.difunto?.fechaNacimiento,
        fechaFallecimiento: pergamino.difunto?.fechaFallecimiento,
        fechasTexto: pergamino.difunto?.fechasTexto,
        fotoUrl: pergamino.difunto?.fotoUrl,
        fotoMarco: pergamino.difunto?.fotoMarco,
        biografia: pergamino.difunto?.biografia
      },
      frase: pergamino.frase,
      serviciosTitulo: pergamino.serviciosTitulo,
      servicios: pergamino.serviciosVisibles(),
      pie: pergamino.pie,
      mensaje: pergamino.mensaje,
      oracion: pergamino.oracion,
      secciones: (pergamino.secciones || [])
        .filter(seccion => seccion.visible)
        .sort((a, b) => a.orden - b.orden),
      estilos: pergamino.estilos,
      funeraria: funeraria && funeraria.nombre
        ? {
            nombre: funeraria.nombre,
            telefono: funeraria.telefono,
            direccion: funeraria.direccion,
            ciudad: funeraria.ciudad,
            branding: funeraria.branding
          }
        : null,
      sala: sala && sala.numero
        ? {
            id: sala._id,
            numero: sala.numero,
            nombre: sala.nombre,
            libroCondolencias: {
              habilitado: sala.libroCondolencias?.habilitado,
              requiereCodigo: sala.libroCondolencias?.requiereCodigo,
              mensajeBienvenida: sala.libroCondolencias?.mensajeBienvenida,
              totalMensajes: sala.libroCondolencias?.totalMensajes
            }
          }
        : null
    };
  }
}

module.exports = new PergaminoService();

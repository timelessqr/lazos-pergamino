// ===================================
// src/modules/funerarias/services/funerariaService.js
// ===================================
const funerariaRepository = require('../repositories/funerariaRepository');
const salaRepository = require('../../salas/repositories/salaRepository');
const qrRepository = require('../../qr/repositories/qrRepository');
const pergaminoRepository = require('../../pergaminos/repositories/pergaminoRepository');
const condolenciaRepository = require('../../condolencias/repositories/condolenciaRepository');
const usuarioRepository = require('../../usuarios/repositories/usuarioRepository');
const { validateFunerariaData } = require('../../../utils/validators');
const { codeGenerator } = require('../../../utils/codeGenerator');
const { qrImageGenerator } = require('../../../utils/qrImageGenerator');
const { BUSINESS, SALAS_DEFAULT, QR_TYPES, MESSAGES } = require('../../../utils/constants');

class FunerariaService {
  /**
   * Registrar funeraria y aprovisionar sus 4 salas.
   * Cada sala nace con: 1 QR fijo + 1 pergamino editable + 1 libro de condolencias.
   */
  async registerFuneraria(funerariaData) {
    try {
      const { error, value } = validateFunerariaData(funerariaData);
      if (error) {
        throw new Error(error.details[0].message);
      }

      if (value.ruc) {
        const existe = await funerariaRepository.existsByRuc(value.ruc);
        if (existe) {
          throw new Error(MESSAGES.ERROR.FUNERARIA_EXISTS);
        }
      }

      const funeraria = await funerariaRepository.create({
        ...value,
        totalSalas: BUSINESS.SALAS_POR_FUNERARIA
      });

      const salas = await this.provisionarSalas(funeraria);

      return {
        funeraria: this.formatFuneraria(funeraria),
        salas,
        message: MESSAGES.SUCCESS.FUNERARIA_CREATED
      };
    } catch (error) {
      throw new Error(`Error registrando funeraria: ${error.message}`);
    }
  }

  /**
   * Crea las N salas fijas de la funeraria con su QR y su pergamino.
   * Si algo falla a medias, revierte lo creado para no dejar basura.
   */
  async provisionarSalas(funeraria) {
    const creadas = [];

    try {
      const plantillas = SALAS_DEFAULT.slice(0, BUSINESS.SALAS_POR_FUNERARIA);

      for (const plantilla of plantillas) {
        // 1. Sala
        const sala = await salaRepository.create({
          funerariaId: funeraria._id,
          numero: plantilla.numero,
          nombre: plantilla.nombre,
          libroCondolencias: {
            habilitado: true,
            requiereCodigo: false,
            requiereModeracion: false,
            totalMensajes: 0
          }
        });

        // 2. QR fijo e irrepetible de la sala
        const code = await this.generarCodigoUnico();
        const qr = await qrRepository.create({
          code,
          url: qrImageGenerator.buildSalaUrl(code),
          tipo: QR_TYPES.SALA,
          funerariaId: funeraria._id,
          salaId: sala._id
        });

        // 3. Pergamino editable, hereda el branding de la funeraria
        const pergamino = await pergaminoRepository.create({
          funerariaId: funeraria._id,
          salaId: sala._id,
          pie: {
            texto: funeraria.nombre.toUpperCase(),
            logoUrl: funeraria.branding?.logoUrl,
            mostrarLogo: true
          },
          estilos: {
            colorPrimario: funeraria.branding?.colorPrimario || '#8C7B5A',
            tipografia: funeraria.branding?.tipografia || 'serif'
          }
        });

        // 4. Vincular todo a la sala
        await salaRepository.linkRecursos(sala._id, {
          qrId: qr._id,
          pergaminoId: pergamino._id
        });

        creadas.push({
          salaId: sala._id,
          numero: sala.numero,
          nombre: sala.nombre,
          qr: { id: qr._id, code: qr.code, url: qr.url },
          pergaminoId: pergamino._id
        });
      }

      return creadas;
    } catch (error) {
      // Rollback: la funeraria no puede quedar con salas a medias
      await this.limpiarRecursos(funeraria._id);
      throw new Error(`Error aprovisionando salas: ${error.message}`);
    }
  }

  /**
   * Genera un codigo de QR que no colisione con ninguno existente
   */
  async generarCodigoUnico(maxAttempts = 20) {
    for (let intento = 0; intento < maxAttempts; intento++) {
      const code = codeGenerator.generateQRCode(10);
      const existe = await qrRepository.codeExists(code);

      if (!existe) return code;
    }

    throw new Error('No se pudo generar un código QR único');
  }

  /**
   * Obtener funeraria por ID
   */
  async getFunerariaById(funerariaId) {
    try {
      return await funerariaRepository.findById(funerariaId);
    } catch (error) {
      throw new Error(`Error obteniendo funeraria: ${error.message}`);
    }
  }

  /**
   * Obtener funeraria con sus salas, QR y pergaminos
   */
  async getFunerariaCompleta(funerariaId) {
    try {
      const funeraria = await funerariaRepository.findByIdWithSalas(funerariaId);

      return {
        funeraria: this.formatFuneraria(funeraria),
        salas: (funeraria.salas || []).map(sala => ({
          id: sala._id,
          numero: sala.numero,
          nombre: sala.nombre,
          activa: sala.activa,
          qr: sala.qrId
            ? {
                id: sala.qrId._id,
                code: sala.qrId.code,
                url: sala.qrId.url,
                imagenUrl: sala.qrId.imagenUrl,
                isActive: sala.qrId.isActive,
                escaneos: sala.qrId.estadisticas?.escaneos || 0
              }
            : null,
          pergamino: sala.pergaminoId
            ? {
                id: sala.pergaminoId._id,
                estado: sala.pergaminoId.estado,
                template: sala.pergaminoId.template,
                difunto: sala.pergaminoId.difunto,
                version: sala.pergaminoId.version,
                ultimaEdicion: sala.pergaminoId.ultimaEdicion
              }
            : null,
          libroCondolencias: sala.libroCondolencias
        }))
      };
    } catch (error) {
      throw new Error(`Error obteniendo funeraria: ${error.message}`);
    }
  }

  /**
   * Obtener funeraria por codigo
   */
  async getFunerariaByCode(codigo) {
    try {
      return await funerariaRepository.findByCode(codigo);
    } catch (error) {
      throw new Error(`Error obteniendo funeraria: ${error.message}`);
    }
  }

  /**
   * Listar funerarias con paginacion
   */
  async getFunerarias(options = {}) {
    try {
      const result = await funerariaRepository.findAll(options);

      return {
        funerarias: result.funerarias.map(funeraria => ({
          id: funeraria._id,
          codigo: funeraria.codigo,
          nombre: funeraria.nombre,
          telefono: funeraria.telefono,
          email: funeraria.email || 'No registrado',
          ciudad: funeraria.ciudad || 'No registrada',
          totalSalas: funeraria.totalSalas,
          activo: funeraria.activo,
          fechaRegistro: funeraria.fechaRegistro
        })),
        pagination: result.pagination
      };
    } catch (error) {
      throw new Error(`Error obteniendo funerarias: ${error.message}`);
    }
  }

  /**
   * Actualizar funeraria
   */
  async updateFuneraria(funerariaId, updateData) {
    try {
      const { error, value } = validateFunerariaData(updateData, true);
      if (error) {
        throw new Error(error.details[0].message);
      }

      const funeraria = await funerariaRepository.update(funerariaId, value);

      return {
        funeraria: this.formatFuneraria(funeraria),
        message: MESSAGES.SUCCESS.FUNERARIA_UPDATED
      };
    } catch (error) {
      throw new Error(`Error actualizando funeraria: ${error.message}`);
    }
  }

  /**
   * Desactivar funeraria (soft delete: conserva salas, QR y pergaminos)
   */
  async deleteFuneraria(funerariaId) {
    try {
      await funerariaRepository.softDelete(funerariaId);
      return { message: MESSAGES.SUCCESS.FUNERARIA_DELETED };
    } catch (error) {
      throw new Error(`Error eliminando funeraria: ${error.message}`);
    }
  }

  /**
   * Buscar funerarias
   */
  async searchFunerarias(termino, limit = 10) {
    try {
      const funerarias = await funerariaRepository.search(termino, limit);

      return funerarias.map(funeraria => ({
        id: funeraria._id,
        codigo: funeraria.codigo,
        nombre: funeraria.nombre,
        telefono: funeraria.telefono,
        ciudad: funeraria.ciudad
      }));
    } catch (error) {
      throw new Error(`Error buscando funerarias: ${error.message}`);
    }
  }

  /**
   * Estadisticas de funerarias
   */
  async getStats() {
    try {
      return await funerariaRepository.getStats();
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Borra en cascada los recursos de una funeraria (rollback / borrado duro)
   */
  async limpiarRecursos(funerariaId) {
    await Promise.all([
      usuarioRepository.deleteByFuneraria(funerariaId),
      condolenciaRepository.deleteByFuneraria(funerariaId),
      pergaminoRepository.deleteByFuneraria(funerariaId),
      qrRepository.deleteByFuneraria(funerariaId),
      salaRepository.deleteByFuneraria(funerariaId)
    ]);
  }

  /**
   * Formatea la funeraria para exponerla por la API
   */
  formatFuneraria(funeraria) {
    return {
      id: funeraria._id,
      codigo: funeraria.codigo,
      nombre: funeraria.nombre,
      razonSocial: funeraria.razonSocial,
      ruc: funeraria.ruc,
      telefono: funeraria.telefono,
      email: funeraria.email,
      direccion: funeraria.direccion,
      ciudad: funeraria.ciudad,
      pais: funeraria.pais,
      sitioWeb: funeraria.sitioWeb,
      branding: funeraria.branding,
      totalSalas: funeraria.totalSalas,
      activo: funeraria.activo,
      fechaRegistro: funeraria.fechaRegistro
    };
  }
}

module.exports = new FunerariaService();

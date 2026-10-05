// ===================================
// src/modules/admin/services/adminService.js
// ===================================
const funerariaService = require('../../funerarias/services/funerariaService');
const usuarioService = require('../../usuarios/services/usuarioService');
const dashboardService = require('../../dashboard/services/dashboardService');
const qrService = require('../../qr/services/qrService');
const funerariaRepository = require('../../funerarias/repositories/funerariaRepository');
const salaRepository = require('../../salas/repositories/salaRepository');
const { ROLES } = require('../../../utils/constants');

class AdminService {
  /**
   * Alta completa: crea la funeraria (con sus 4 salas, QR y pergaminos)
   * y ademas el usuario que la administrara.
   */
  async registrarFunerariaCompleta(payload) {
    try {
      const { funeraria: funerariaData, usuario: usuarioData } = payload;

      if (!funerariaData) {
        throw new Error('Los datos de la funeraria son requeridos');
      }

      const resultFuneraria = await funerariaService.registerFuneraria(funerariaData);

      let usuario = null;

      // El usuario ya existe en core-qr; aqui solo le damos acceso a esta
      // plataforma con su rol y su funeraria.
      if (usuarioData) {
        try {
          const resultUsuario = await usuarioService.registrarAcceso({
            ...usuarioData,
            rol: ROLES.FUNERARIA,
            funerariaId: resultFuneraria.funeraria.id
          });

          usuario = resultUsuario.usuario;
        } catch (error) {
          // Si el acceso falla, la funeraria ya quedo creada: revertimos todo
          await funerariaService.limpiarRecursos(resultFuneraria.funeraria.id);
          await funerariaRepository.update(resultFuneraria.funeraria.id, { activo: false });

          throw new Error(`Error dando acceso al usuario de la funeraria: ${error.message}`);
        }
      }

      return {
        funeraria: resultFuneraria.funeraria,
        salas: resultFuneraria.salas,
        usuario,
        message: 'Funeraria registrada con sus 4 salas, QR, pergaminos y acceso de usuario'
      };
    } catch (error) {
      throw new Error(`Error en registro completo: ${error.message}`);
    }
  }

  /**
   * Resumen operativo de una funeraria
   */
  async getResumenFuneraria(funerariaId) {
    try {
      const [completa, dashboard, qrStats] = await Promise.all([
        funerariaService.getFunerariaCompleta(funerariaId),
        dashboardService.getDashboardFuneraria(funerariaId),
        qrService.getStatsByFuneraria(funerariaId)
      ]);

      return {
        funeraria: completa.funeraria,
        salas: completa.salas,
        metricas: dashboard.resumen,
        qr: qrStats
      };
    } catch (error) {
      throw new Error(`Error obteniendo resumen: ${error.message}`);
    }
  }

  /**
   * Busqueda global de funerarias
   */
  async buscar(termino, limit = 10) {
    try {
      if (!termino) {
        throw new Error('El término de búsqueda es requerido');
      }

      const funerarias = await funerariaService.searchFunerarias(termino, limit);

      return { funerarias, total: funerarias.length };
    } catch (error) {
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }

  /**
   * Genera y guarda las imagenes de los 4 QR de una funeraria (para imprimir)
   */
  async generarImagenesQR(funerariaId) {
    try {
      const salas = await salaRepository.findByFuneraria(funerariaId);
      const resultados = [];

      for (const sala of salas) {
        if (!sala.qrId) continue;

        const qrId = sala.qrId._id || sala.qrId;
        const result = await qrService.generarYGuardarImagen(qrId);

        resultados.push({
          sala: { numero: sala.numero, nombre: sala.nombre },
          qr: result.qr
        });
      }

      return {
        qrs: resultados,
        message: `${resultados.length} imágenes de QR generadas`
      };
    } catch (error) {
      throw new Error(`Error generando imágenes QR: ${error.message}`);
    }
  }

  /**
   * Metricas globales de la plataforma
   */
  async getMetricas() {
    try {
      const [dashboard, statsFunerarias] = await Promise.all([
        dashboardService.getDashboardGlobal(),
        funerariaService.getStats()
      ]);

      return {
        ...dashboard.resumen,
        funerariasDetalle: statsFunerarias,
        topFunerarias: dashboard.topFunerarias
      };
    } catch (error) {
      throw new Error(`Error obteniendo métricas: ${error.message}`);
    }
  }

  /**
   * Estado de salud del sistema
   */
  async getHealth() {
    const mongoose = require('mongoose');

    return {
      status: 'OK',
      database: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada',
      uptime: Math.floor(process.uptime()),
      memoria: {
        usadaMB: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        totalMB: Math.round(process.memoryUsage().heapTotal / (1024 * 1024))
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AdminService();

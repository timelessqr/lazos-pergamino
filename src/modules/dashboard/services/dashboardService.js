// ===================================
// src/modules/dashboard/services/dashboardService.js
// ===================================
const dashboardRepository = require('../repositories/dashboardRepository');

class DashboardService {
  /**
   * Dashboard global de la plataforma (superadmin)
   */
  async getDashboardGlobal() {
    try {
      const [counters, topFunerarias] = await Promise.all([
        dashboardRepository.getGlobalCounters(),
        dashboardRepository.getTopFunerarias(5)
      ]);

      return {
        resumen: counters,
        topFunerarias,
        generadoEn: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error obteniendo dashboard: ${error.message}`);
    }
  }

  /**
   * Dashboard de una funeraria: sus 4 salas de un vistazo
   */
  async getDashboardFuneraria(funerariaId) {
    try {
      const [counters, salas, actividad] = await Promise.all([
        dashboardRepository.getFunerariaCounters(funerariaId),
        dashboardRepository.getResumenSalas(funerariaId),
        dashboardRepository.getActividadReciente(funerariaId, 10)
      ]);

      return {
        resumen: counters,
        salas: salas.map(sala => ({
          id: sala._id,
          numero: sala.numero,
          nombre: sala.nombre,
          activa: sala.activa,
          qr: { code: sala.qrCode, activo: sala.qrActivo, escaneos: sala.escaneos || 0 },
          pergamino: {
            estado: sala.pergaminoEstado,
            difunto: sala.difunto
              ? `${sala.difunto.nombre || ''} ${sala.difunto.apellido || ''}`.trim() || 'Sin asignar'
              : 'Sin asignar',
            ultimaEdicion: sala.ultimaEdicion
          },
          condolencias: sala.totalMensajes || 0
        })),
        actividadReciente: actividad.map(item => ({
          id: item._id,
          nombre: item.nombre,
          mensaje: item.mensaje?.slice(0, 120),
          sala: item.salaId,
          estado: item.estado,
          fecha: item.createdAt
        })),
        generadoEn: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error obteniendo dashboard: ${error.message}`);
    }
  }
}

module.exports = new DashboardService();

// ===================================
// src/modules/dashboard/repositories/dashboardRepository.js
// ===================================
const mongoose = require('mongoose');
const Funeraria = require('../../../models/Funeraria');
const Sala = require('../../../models/Sala');
const QR = require('../../../models/QR');
const Pergamino = require('../../../models/Pergamino');
const Condolencia = require('../../../models/Condolencia');

class DashboardRepository {
  /**
   * Contadores globales de la plataforma (vista superadmin)
   */
  async getGlobalCounters() {
    const [funerarias, salas, qrs, pergaminos, condolencias] = await Promise.all([
      Funeraria.countDocuments({ activo: true }),
      Sala.countDocuments({}),
      QR.countDocuments({}),
      Pergamino.countDocuments({}),
      Condolencia.countDocuments({})
    ]);

    return { funerarias, salas, qrs, pergaminos, condolencias };
  }

  /**
   * Contadores de una funeraria
   */
  async getFunerariaCounters(funerariaId) {
    const oid = new mongoose.Types.ObjectId(funerariaId);

    const [salas, pergaminosPublicados, condolencias, qrStats] = await Promise.all([
      Sala.countDocuments({ funerariaId: oid }),
      Pergamino.countDocuments({ funerariaId: oid, estado: 'publicado' }),
      Condolencia.countDocuments({ funerariaId: oid }),
      QR.aggregate([
        { $match: { funerariaId: oid } },
        {
          $group: {
            _id: null,
            totalVistas: { $sum: '$estadisticas.vistas' },
            totalEscaneos: { $sum: '$estadisticas.escaneos' }
          }
        }
      ])
    ]);

    return {
      salas,
      pergaminosPublicados,
      condolencias,
      vistas: qrStats[0]?.totalVistas || 0,
      escaneos: qrStats[0]?.totalEscaneos || 0
    };
  }

  /**
   * Resumen por sala: estado del pergamino, escaneos y mensajes
   */
  async getResumenSalas(funerariaId) {
    const oid = new mongoose.Types.ObjectId(funerariaId);

    return await Sala.aggregate([
      { $match: { funerariaId: oid } },
      { $sort: { numero: 1 } },
      {
        $lookup: { from: 'qrs', localField: 'qrId', foreignField: '_id', as: 'qr' }
      },
      {
        $lookup: { from: 'pergaminos', localField: 'pergaminoId', foreignField: '_id', as: 'pergamino' }
      },
      {
        $project: {
          numero: 1,
          nombre: 1,
          activa: 1,
          totalMensajes: '$libroCondolencias.totalMensajes',
          qrCode: { $arrayElemAt: ['$qr.code', 0] },
          qrActivo: { $arrayElemAt: ['$qr.isActive', 0] },
          escaneos: { $arrayElemAt: ['$qr.estadisticas.escaneos', 0] },
          pergaminoEstado: { $arrayElemAt: ['$pergamino.estado', 0] },
          difunto: { $arrayElemAt: ['$pergamino.difunto', 0] },
          ultimaEdicion: { $arrayElemAt: ['$pergamino.ultimaEdicion', 0] }
        }
      }
    ]);
  }

  /**
   * Actividad reciente de condolencias de una funeraria
   */
  async getActividadReciente(funerariaId, limit = 10) {
    return await Condolencia.find({ funerariaId })
      .select('nombre mensaje salaId createdAt estado')
      .populate('salaId', 'numero nombre')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Funerarias con mas actividad (vista superadmin)
   */
  async getTopFunerarias(limit = 5) {
    return await QR.aggregate([
      {
        $group: {
          _id: '$funerariaId',
          escaneos: { $sum: '$estadisticas.escaneos' },
          vistas: { $sum: '$estadisticas.vistas' }
        }
      },
      { $sort: { escaneos: -1 } },
      { $limit: limit },
      {
        $lookup: { from: 'funerarias', localField: '_id', foreignField: '_id', as: 'funeraria' }
      },
      {
        $project: {
          escaneos: 1,
          vistas: 1,
          nombre: { $arrayElemAt: ['$funeraria.nombre', 0] },
          codigo: { $arrayElemAt: ['$funeraria.codigo', 0] }
        }
      }
    ]);
  }
}

module.exports = new DashboardRepository();

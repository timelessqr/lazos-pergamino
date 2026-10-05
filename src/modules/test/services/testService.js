// ===================================
// src/modules/test/services/testService.js
// Módulo de pruebas manuales. Solo se monta fuera de producción.
// ===================================
const mongoose = require('mongoose');

const UsuarioFuneraria = require('../../../models/UsuarioFuneraria');
const Funeraria = require('../../../models/Funeraria');
const Sala = require('../../../models/Sala');
const QR = require('../../../models/QR');
const Pergamino = require('../../../models/Pergamino');
const Condolencia = require('../../../models/Condolencia');
const Media = require('../../../models/Media');

const funerariaService = require('../../funerarias/services/funerariaService');
const pergaminoService = require('../../pergaminos/services/pergaminoService');
const condolenciaService = require('../../condolencias/services/condolenciaService');
const qrService = require('../../qr/services/qrService');
const salaService = require('../../salas/services/salaService');
const { storageService } = require('../../../services/storage/storageService');
const { BUSINESS } = require('../../../utils/constants');

const MODELOS = { UsuarioFuneraria, Funeraria, Sala, QR, Pergamino, Condolencia, Media };

// Datos de ejemplo tomados del diseño real del pergamino
const PERGAMINO_EJEMPLO = {
  difunto: {
    nombre: 'Raúl Esteban',
    apellido: 'Martínez González',
    fechaNacimiento: '1948-04-10',
    fechaFallecimiento: '2024-05-15',
    fechasTexto: '10 ABRIL 1948  -  15 MAYO 2024',
    fotoMarco: 'ovalo'
  },
  frase: 'Tu amor y tu ejemplo vivirán por siempre en nuestros corazones.',
  servicios: [
    {
      tipo: 'velatorio', titulo: 'VELATORIO', icono: 'calendario',
      fechaTexto: 'Jueves 16 de mayo de 2024', horaTexto: '15:00 a 22:00 hrs.',
      lugar: 'Salón Lazos de Vida', direccion: 'Av. Los Carrera 1234, Rancagua', orden: 0
    },
    {
      tipo: 'ceremonia_religiosa', titulo: 'CEREMONIA RELIGIOSA', icono: 'iglesia',
      fechaTexto: 'Viernes 17 de mayo de 2024', horaTexto: '11:00 hrs.',
      lugar: 'Parroquia San Francisco', direccion: 'Estado 567, Rancagua', orden: 1
    },
    {
      tipo: 'sepultura', titulo: 'DESPEDIDA Y SEPULTURA', icono: 'hoja',
      fechaTexto: 'Viernes 17 de mayo de 2024', horaTexto: '12:30 hrs.',
      lugar: 'Cementerio Parque Jardines de la Paz', direccion: 'Ruta 5 Sur Km. 96, Rancagua', orden: 2
    }
  ]
};

class TestService {
  // ============ ESTADO ============

  /**
   * Estado de la conexión y conteo de cada colección
   */
  async getEstado() {
    const estados = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    const conectado = mongoose.connection.readyState === 1;

    const colecciones = {};

    if (conectado) {
      for (const [nombre, modelo] of Object.entries(MODELOS)) {
        colecciones[modelo.collection.collectionName] = await modelo.countDocuments();
      }
    }

    return {
      database: {
        estado: estados[mongoose.connection.readyState],
        nombre: mongoose.connection.name,
        host: mongoose.connection.host
      },
      colecciones,
      storage: storageService.getInfo(),
      reglas: {
        salasPorFuneraria: BUSINESS.SALAS_POR_FUNERARIA,
        qrsPorSala: BUSINESS.QRS_POR_SALA
      }
    };
  }

  /**
   * Verifica las invariantes del dominio en toda la base
   */
  async verificarIntegridad() {
    const problemas = [];
    const funerarias = await Funeraria.find({}).lean();

    for (const funeraria of funerarias) {
      const salas = await Sala.find({ funerariaId: funeraria._id }).lean();

      // Regla 1: cada funeraria tiene exactamente sus N salas
      if (salas.length !== funeraria.totalSalas) {
        problemas.push({
          tipo: 'salas_incompletas',
          funeraria: funeraria.codigo,
          detalle: `tiene ${salas.length} salas, deberia tener ${funeraria.totalSalas}`
        });
      }

      for (const sala of salas) {
        // Regla 2: cada sala tiene su QR
        const qr = await QR.findOne({ salaId: sala._id }).lean();
        if (!qr) {
          problemas.push({ tipo: 'sala_sin_qr', funeraria: funeraria.codigo, sala: sala.numero });
        }

        // Regla 3: cada sala tiene su pergamino
        const pergamino = await Pergamino.findOne({ salaId: sala._id }).lean();
        if (!pergamino) {
          problemas.push({ tipo: 'sala_sin_pergamino', funeraria: funeraria.codigo, sala: sala.numero });
        }

        // Regla 4: los punteros de la sala apuntan a los recursos correctos
        if (qr && sala.qrId && String(sala.qrId) !== String(qr._id)) {
          problemas.push({ tipo: 'qr_desvinculado', funeraria: funeraria.codigo, sala: sala.numero });
        }
      }
    }

    // Regla 5: no puede haber dos QR con el mismo código
    const duplicados = await QR.aggregate([
      { $group: { _id: '$code', total: { $sum: 1 } } },
      { $match: { total: { $gt: 1 } } }
    ]);

    duplicados.forEach(dup => {
      problemas.push({ tipo: 'qr_duplicado', detalle: `el código ${dup._id} se repite ${dup.total} veces` });
    });

    return {
      ok: problemas.length === 0,
      funerariasRevisadas: funerarias.length,
      problemas
    };
  }

  // ============ DATOS DE PRUEBA ============

  /**
   * Crea un escenario completo listo para probar: superadmin, funeraria con
   * sus 4 salas, pergamino publicado en la Sala 1 y una condolencia.
   */
  async crearEscenario(options = {}) {
    const sufijo = Date.now().toString().slice(-6);
    const nombreFuneraria = options.nombre || `Funeraria Test ${sufijo}`;

    const registro = await funerariaService.registerFuneraria({
      nombre: nombreFuneraria,
      telefono: '+56 9 1234 5678',
      email: `contacto${sufijo}@test.cl`,
      direccion: 'Av. Los Carrera 1234',
      ciudad: 'Rancagua',
      pais: 'Chile',
      branding: { colorPrimario: '#8C7B5A', colorSecundario: '#C9A227', tipografia: 'serif' }
    });

    const sala1 = registro.salas[0];

    await pergaminoService.updatePergamino(sala1.pergaminoId, PERGAMINO_EJEMPLO);
    await pergaminoService.publicar(sala1.pergaminoId);

    await condolenciaService.crearCondolencia(sala1.qr.code, {
      nombre: 'María Pérez',
      relacion: 'Amiga de la familia',
      mensaje: 'Mi más sentido pésame para toda la familia.'
    }, { ip: '127.0.0.1', userAgent: 'test-module' });

    return {
      nota: 'Las rutas están abiertas: la autenticación aún no está definida.',
      funeraria: registro.funeraria,
      salas: registro.salas,
      salaPublicada: {
        numero: sala1.numero,
        qrCode: sala1.qr.code,
        urlPublica: `/api/pergamino/${sala1.qr.code}`
      },
      siguientePaso: `curl -s http://localhost:3000/api/pergamino/${sala1.qr.code}`
    };
  }

  /**
   * Rellena el pergamino de una sala con los datos de ejemplo y lo publica
   */
  async llenarPergamino(salaId, publicar = true) {
    const pergamino = await pergaminoService.getPergaminoBySala(salaId);

    await pergaminoService.updatePergamino(pergamino.id, PERGAMINO_EJEMPLO);

    if (publicar) {
      await pergaminoService.publicar(pergamino.id);
    }

    return await pergaminoService.getPergaminoById(pergamino.id);
  }

  /**
   * Borra los datos de prueba (funerarias cuyo nombre empieza por "Funeraria Test")
   */
  async limpiarDatosPrueba() {
    const funerarias = await Funeraria.find({ nombre: /^Funeraria Test/ }).lean();
    const ids = funerarias.map(f => f._id);

    if (ids.length === 0) {
      return { eliminadas: 0, message: 'No había datos de prueba' };
    }

    const [condolencias, media, pergaminos, qrs, salas] = await Promise.all([
      Condolencia.deleteMany({ funerariaId: { $in: ids } }),
      Media.deleteMany({ funerariaId: { $in: ids } }),
      Pergamino.deleteMany({ funerariaId: { $in: ids } }),
      QR.deleteMany({ funerariaId: { $in: ids } }),
      Sala.deleteMany({ funerariaId: { $in: ids } })
    ]);

    await Funeraria.deleteMany({ _id: { $in: ids } });

    return {
      eliminadas: ids.length,
      detalle: {
        funerarias: ids.length,
        salas: salas.deletedCount,
        qrs: qrs.deletedCount,
        pergaminos: pergaminos.deletedCount,
        condolencias: condolencias.deletedCount,
        media: media.deletedCount
      }
    };
  }

  // ============ INSPECCION ============

  /**
   * Vuelca el contenido de una colección
   */
  async dumpColeccion(nombre, limit = 20) {
    const modelo = Object.values(MODELOS).find(
      m => m.collection.collectionName === nombre || m.modelName.toLowerCase() === nombre.toLowerCase()
    );

    if (!modelo) {
      throw new Error(`Colección desconocida: ${nombre}. Disponibles: ${Object.values(MODELOS).map(m => m.collection.collectionName).join(', ')}`);
    }

    const [documentos, total] = await Promise.all([
      modelo.find({}).limit(parseInt(limit)).lean(),
      modelo.countDocuments()
    ]);

    return { coleccion: modelo.collection.collectionName, total, mostrados: documentos.length, documentos };
  }

  /**
   * Traza el árbol completo de una funeraria: salas → QR, pergamino, condolencias
   */
  async trazarFuneraria(funerariaId) {
    const completa = await funerariaService.getFunerariaCompleta(funerariaId);
    const salas = [];

    for (const sala of completa.salas) {
      const condolencias = await Condolencia.countDocuments({ salaId: sala.id });

      salas.push({
        numero: sala.numero,
        nombre: sala.nombre,
        qr: sala.qr ? { code: sala.qr.code, url: sala.qr.url, escaneos: sala.qr.escaneos } : null,
        pergamino: sala.pergamino
          ? {
              estado: sala.pergamino.estado,
              difunto: `${sala.pergamino.difunto?.nombre || ''} ${sala.pergamino.difunto?.apellido || ''}`.trim() || 'Sin asignar',
              version: sala.pergamino.version
            }
          : null,
        condolencias
      });
    }

    return { funeraria: completa.funeraria, salas };
  }

  /**
   * Simula un escaneo del QR sin pasar por la ruta pública
   */
  async simularEscaneo(code) {
    return await qrService.accederPorCodigo(code, { ip: '127.0.0.1', userAgent: 'test-module' });
  }

  /**
   * Lista todos los QR de la base con su sala y funeraria
   */
  async listarQRs() {
    const qrs = await QR.find({})
      .populate('funerariaId', 'codigo nombre')
      .populate('salaId', 'numero nombre')
      .sort({ createdAt: 1 })
      .lean();

    return qrs.map(qr => ({
      code: qr.code,
      url: qr.url,
      activo: qr.isActive,
      escaneos: qr.estadisticas?.escaneos || 0,
      funeraria: qr.funerariaId?.nombre,
      sala: qr.salaId ? `Sala ${qr.salaId.numero}` : null,
      pruebaPublica: `/api/pergamino/${qr.code}`
    }));
  }
}

module.exports = new TestService();

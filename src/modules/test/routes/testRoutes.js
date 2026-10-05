// ===================================
// src/modules/test/routes/testRoutes.js
// Endpoints de prueba manual. NO se montan en producción
// (ver la guarda en src/routes/index.js).
// ===================================
// ⚠️ RUTAS ABIERTAS: la autenticación está pendiente de definir.
// Los middlewares auth / scopeFuneraria / requireOwnership siguen en
// src/middleware/ por si se reconectan; hoy NO se aplican.
const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { validateObjectId } = require('../../../middleware/validation');

/**
 * @route   GET /api/test
 * @desc    Índice de los endpoints de prueba disponibles
 * @access  Public (solo fuera de producción)
 */
router.get('/', (req, res) => {
  res.json({
    message: '🧪 Módulo de pruebas — Lazos Pergamino',
    aviso: 'Estos endpoints NO se montan cuando NODE_ENV=production',
    endpoints: {
      estado: 'GET /api/test/estado — conexión, conteo de colecciones y storage',
      integridad: 'GET /api/test/integridad — verifica las reglas del dominio',
      crearEscenario: 'POST /api/test/escenario — crea funeraria + 4 salas + pergamino publicado',
      llenarPergamino: 'POST /api/test/salas/:salaId/llenar — rellena y publica un pergamino',
      limpiar: 'DELETE /api/test/limpiar — borra las funerarias de prueba',
      coleccion: 'GET /api/test/coleccion/:nombre?limit=20 — vuelca una colección',
      trazar: 'GET /api/test/funerarias/:id/trazar — árbol completo de la funeraria',
      listarQRs: 'GET /api/test/qr — todos los QR con su URL pública',
      escanear: 'GET /api/test/escanear/:code — simula el escaneo de un QR'
    },
    inicioRapido: [
      'curl -s -X POST http://localhost:3000/api/test/escenario | jq',
      'curl -s http://localhost:3000/api/test/integridad | jq',
      'curl -s http://localhost:3000/api/test/qr | jq'
    ]
  });
});

/**
 * @route   GET /api/test/estado
 * @desc    Estado de la BD, conteo de colecciones y driver de storage
 */
router.get('/estado', testController.getEstado);

/**
 * @route   GET /api/test/integridad
 * @desc    Verifica las invariantes: 4 salas por funeraria, 1 QR y 1 pergamino
 *          por sala, punteros correctos y códigos QR sin duplicados
 */
router.get('/integridad', testController.verificarIntegridad);

/**
 * @route   POST /api/test/escenario
 * @desc    Crea un escenario completo listo para probar
 * @body    { nombre? }
 */
router.post('/escenario', testController.crearEscenario);

/**
 * @route   DELETE /api/test/limpiar
 * @desc    Elimina las funerarias de prueba y todo lo que cuelga de ellas
 */
router.delete('/limpiar', testController.limpiar);

/**
 * @route   GET /api/test/qr
 * @desc    Lista todos los QR con su URL pública de prueba
 */
router.get('/qr', testController.listarQRs);

/**
 * @route   GET /api/test/escanear/:code
 * @desc    Simula el escaneo de un QR
 */
router.get('/escanear/:code', testController.simularEscaneo);

/**
 * @route   GET /api/test/coleccion/:nombre
 * @desc    Vuelca los documentos de una colección
 * @query   limit
 */
router.get('/coleccion/:nombre', testController.dumpColeccion);

/**
 * @route   GET /api/test/funerarias/:id/trazar
 * @desc    Árbol completo: funeraria → salas → QR, pergamino y condolencias
 */
router.get('/funerarias/:id/trazar', validateObjectId('id'), testController.trazarFuneraria);

/**
 * @route   POST /api/test/salas/:salaId/llenar
 * @desc    Rellena el pergamino de la sala con datos de ejemplo y lo publica
 * @body    { publicar?: boolean }
 */
router.post('/salas/:salaId/llenar', validateObjectId('salaId'), testController.llenarPergamino);

module.exports = router;

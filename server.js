// ===================================
// server.js
// ===================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('./src/config/database');
const { environment, validateEnvironment } = require('./src/config/environment');
const { generalLimiter } = require('./src/middleware/rateLimiter');

validateEnvironment();

const app = express();

// Render pone un proxy delante: sin esto req.ip es la del proxy y el rate
// limiter cuenta a todos los visitantes como si fueran uno solo
app.set('trust proxy', 1);

// Conectar a la base de datos (sin crashear si falla en desarrollo)
connectDB().catch(() => {
  console.log('⚠️  Servidor iniciado sin BD. Conéctate después.');
});

// Seguridad
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    environment.frontendUrl
  ].filter(Boolean),
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Archivos subidos (fotos de pergaminos, imágenes de QR)
app.use('/uploads', express.static(environment.uploadDir));

// Logging de peticiones
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Rate limiting general
app.use('/api', generalLimiter);

// Raíz
app.get('/', (req, res) => {
  res.json({
    message: '📜 Lazos Pergamino API funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      usuarios: '/api/usuarios'
    }
  });
});

// Salud
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');

  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    service: 'Lazos Pergamino API',
    environment: environment.nodeEnv,
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Rutas de la API
const routes = require('./src/routes');
app.use('/api', routes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: 'Error interno del servidor',
    error: environment.isDevelopment ? err.message : 'Something went wrong'
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

const PORT = environment.port;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌍 Ambiente: ${environment.nodeEnv}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`💚 Salud: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth: la emite core-qr (este backend solo verifica su token)`);
    console.log(`📜 Pergamino público: http://localhost:${PORT}/api/pergamino/:code`);
    console.log('🔄 Presiona Ctrl+C para detener');
  });
}

module.exports = app;

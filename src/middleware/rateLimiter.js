// ===================================
// src/middleware/rateLimiter.js
// ===================================
const rateLimit = require('express-rate-limit');
const { SECURITY } = require('../utils/constants');

// En los tests el limitador falsearia los resultados: se desactiva
const esTest = process.env.NODE_ENV === 'test';
const noop = (req, res, next) => next();

/**
 * Crea un limitador, o lo desactiva si estamos en tests
 */
const crearLimitador = (options) => (esTest ? noop : rateLimit(options));

/**
 * Limitador general para toda la API
 */
const generalLimiter = crearLimitador({
  windowMs: SECURITY.RATE_LIMIT_WINDOW,
  max: SECURITY.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Demasiadas peticiones, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Limitador estricto para login
 */
const authLimiter = crearLimitador({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de login, espera 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Limitador para el libro de condolencias (endpoint publico)
 */
const condolenciaLimiter = crearLimitador({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Has enviado demasiados mensajes, intenta más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Limitador para escaneo publico de QR
 */
const publicLimiter = crearLimitador({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Demasiadas peticiones, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { generalLimiter, authLimiter, condolenciaLimiter, publicLimiter };

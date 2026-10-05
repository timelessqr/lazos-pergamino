// ===================================
// src/middleware/validation.js
// ===================================
const mongoose = require('mongoose');
const { responseHelper } = require('../utils/responseHelper');
const { schemas, validate, validateFile } = require('../utils/validators');

/**
 * Verifica que los params indicados sean ObjectId validos
 */
const validateObjectId = (...params) => {
  return (req, res, next) => {
    for (const param of params) {
      const value = req.params[param];

      if (value && !mongoose.isValidObjectId(value)) {
        return responseHelper.error(res, `El parámetro ${param} no es un ID válido`, 400);
      }
    }

    next();
  };
};

/**
 * Normaliza page y limit de la query
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (page < 1) {
    return responseHelper.error(res, 'El parámetro page debe ser mayor a 0', 400);
  }

  if (limit < 1 || limit > 100) {
    return responseHelper.error(res, 'El parámetro limit debe estar entre 1 y 100', 400);
  }

  req.pagination = { page, limit };
  next();
};

module.exports = { validate, validateFile, validateObjectId, validatePagination, schemas };

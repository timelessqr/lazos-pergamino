// ===================================
// src/middleware/upload.js
// ===================================
const multer = require('multer');
const path = require('path');
const { FILE_LIMITS, FORMATOS_PERMITIDOS } = require('../utils/constants');

// Guardamos en memoria: el storageService decide destino final (local o R2)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).replace('.', '').toLowerCase();

  if (FORMATOS_PERMITIDOS.fotos.includes(extension)) {
    return cb(null, true);
  }

  cb(new Error(`Formato no permitido. Use: ${FORMATOS_PERMITIDOS.fotos.join(', ')}`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILE_LIMITS.FOTO_MAX_SIZE }
});

/**
 * Traduce los errores de multer al formato de respuesta de la API
 */
const handleUploadError = (err, req, res, next) => {
  const { responseHelper } = require('../utils/responseHelper');

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMB = Math.floor(FILE_LIMITS.FOTO_MAX_SIZE / (1024 * 1024));
      return responseHelper.error(res, `Archivo demasiado grande. Máximo: ${maxMB}MB`, 400);
    }

    return responseHelper.error(res, err.message, 400);
  }

  if (err) {
    return responseHelper.error(res, err.message, 400);
  }

  next();
};

module.exports = { upload, handleUploadError };

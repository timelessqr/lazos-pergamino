// ===================================
// src/models/Media.js
// ===================================
const mongoose = require('mongoose');
const { PROCESSING_STATUS } = require('../utils/constants');

const mediaSchema = new mongoose.Schema({
  // Los archivos cuelgan de la sala/pergamino que los usa
  funerariaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Funeraria',
    required: [true, 'La funeraria es requerida']
  },
  salaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sala',
    required: [true, 'La sala es requerida']
  },
  pergaminoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pergamino'
  },

  tipo: {
    type: String,
    enum: ['foto', 'logo'],
    default: 'foto',
    required: true
  },

  // Seccion del pergamino donde se muestra. Las mismas que acepta
  // schemas.mediaUpload; 'datos_difunto' queda por compatibilidad
  seccion: {
    type: String,
    enum: ['galeria_fotos', 'retrato', 'encabezado', 'pie_funeraria', 'datos_difunto'],
    default: 'galeria_fotos'
  },

  titulo: {
    type: String,
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  tags: [{ type: String, trim: true, maxlength: 30 }],

  // Datos del archivo almacenado
  archivo: {
    nombreOriginal: { type: String, trim: true },
    nombreAlmacenado: { type: String, trim: true },
    ruta: { type: String, trim: true },
    url: { type: String, trim: true, required: true },
    thumbnailUrl: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    extension: { type: String, trim: true, lowercase: true },
    tamano: { type: Number, min: 0 },
    ancho: { type: Number, min: 0 },
    alto: { type: Number, min: 0 },
    driver: { type: String, enum: ['local', 'r2'], default: 'local' }
  },

  orden: {
    type: Number,
    default: 0,
    min: 0
  },

  estadoProcesamiento: {
    type: String,
    enum: Object.values(PROCESSING_STATUS),
    default: PROCESSING_STATUS.COMPLETED
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indices
mediaSchema.index({ salaId: 1, seccion: 1, orden: 1 });
mediaSchema.index({ funerariaId: 1 });
mediaSchema.index({ pergaminoId: 1 });
mediaSchema.index({ isActive: 1 });

// Almacenamiento total usado por una sala (en bytes)
mediaSchema.statics.storageUsadoPorSala = async function(salaId) {
  const result = await this.aggregate([
    { $match: { salaId: new mongoose.Types.ObjectId(salaId), isActive: true } },
    { $group: { _id: null, total: { $sum: '$archivo.tamano' }, count: { $sum: 1 } } }
  ]);

  return result.length > 0 ? { bytes: result[0].total || 0, archivos: result[0].count } : { bytes: 0, archivos: 0 };
};

module.exports = mongoose.model('Media', mediaSchema);

// ===================================
// src/models/Condolencia.js
// ===================================
const mongoose = require('mongoose');
const { CONDOLENCIA_STATUS } = require('../utils/constants');

const condolenciaSchema = new mongoose.Schema({
  // Una condolencia pertenece al libro de UNA sala
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
    ref: 'Pergamino',
    required: [true, 'El pergamino es requerido']
  },

  // Snapshot del difunto al momento del mensaje: el pergamino es editable
  // y se sobrescribe, asi el mensaje conserva a quien iba dirigido
  difuntoSnapshot: {
    nombre: { type: String, trim: true },
    apellido: { type: String, trim: true }
  },

  // Autor del mensaje (visitante publico, sin cuenta)
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  relacion: {
    type: String,
    trim: true,
    maxlength: [80, 'La relación no puede exceder 80 caracteres']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  mensaje: {
    type: String,
    required: [true, 'El mensaje es requerido'],
    trim: true,
    minlength: [3, 'El mensaje es demasiado corto'],
    maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres']
  },

  estado: {
    type: String,
    enum: Object.values(CONDOLENCIA_STATUS),
    default: CONDOLENCIA_STATUS.APROBADA
  },

  // Trazabilidad del envio
  metadata: {
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true }
  },

  // Moderacion
  fechaModeracion: {
    type: Date
  }
}, {
  timestamps: true
});

// Indices
condolenciaSchema.index({ salaId: 1, createdAt: -1 });
condolenciaSchema.index({ funerariaId: 1, createdAt: -1 });
condolenciaSchema.index({ pergaminoId: 1 });
condolenciaSchema.index({ estado: 1 });

// Aprobar el mensaje
condolenciaSchema.methods.aprobar = function() {
  this.estado = CONDOLENCIA_STATUS.APROBADA;
  this.fechaModeracion = new Date();
  return this.save();
};

// Rechazar el mensaje
condolenciaSchema.methods.rechazar = function() {
  this.estado = CONDOLENCIA_STATUS.RECHAZADA;
  this.fechaModeracion = new Date();
  return this.save();
};

// Mensajes visibles al publico de una sala
condolenciaSchema.statics.publicasDeSala = function(salaId) {
  return this.find({ salaId, estado: CONDOLENCIA_STATUS.APROBADA }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Condolencia', condolenciaSchema);

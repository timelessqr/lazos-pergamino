// ===================================
// src/models/Sala.js
// ===================================
const mongoose = require('mongoose');

const salaSchema = new mongoose.Schema({
  funerariaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Funeraria',
    required: [true, 'La funeraria es requerida']
  },

  // Numero fijo de sala dentro de la funeraria: 1..4
  numero: {
    type: Number,
    required: [true, 'El número de sala es requerido'],
    min: [1, 'El número de sala debe ser al menos 1']
  },

  nombre: {
    type: String,
    required: [true, 'El nombre de la sala es requerido'],
    trim: true,
    maxlength: [80, 'El nombre no puede exceder 80 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [300, 'La descripción no puede exceder 300 caracteres']
  },
  capacidad: {
    type: Number,
    min: 0,
    default: 0
  },
  ubicacion: {
    type: String,
    trim: true,
    maxlength: [150, 'La ubicación no puede exceder 150 caracteres']
  },

  // QR fijo de la sala (1 por sala, nunca cambia)
  qrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QR'
  },
  // Pergamino editable de la sala (1 por sala)
  pergaminoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pergamino'
  },

  // Configuracion del libro de condolencias de esta sala
  libroCondolencias: {
    habilitado: { type: Boolean, default: true },
    requiereCodigo: { type: Boolean, default: false },
    codigoAcceso: { type: String, trim: true },
    requiereModeracion: { type: Boolean, default: false },
    mensajeBienvenida: {
      type: String,
      trim: true,
      maxlength: [300, 'El mensaje de bienvenida no puede exceder 300 caracteres'],
      default: 'Deja tu mensaje de condolencia para la familia'
    },
    totalMensajes: { type: Number, default: 0, min: 0 }
  },

  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indices: una funeraria no puede repetir numero de sala
salaSchema.index({ funerariaId: 1, numero: 1 }, { unique: true });
salaSchema.index({ funerariaId: 1, activa: 1 });

// Etiqueta legible de la sala
salaSchema.virtual('etiqueta').get(function() {
  return `${this.nombre} (#${this.numero})`;
});

// Incrementar contador de mensajes del libro
salaSchema.methods.incrementarMensajes = function() {
  this.libroCondolencias.totalMensajes += 1;
  return this.save();
};

// Validar el codigo de acceso al libro de condolencias
salaSchema.methods.validarCodigoAcceso = function(codigo) {
  if (!this.libroCondolencias.requiereCodigo) return true;
  if (!this.libroCondolencias.codigoAcceso) return true;
  return this.libroCondolencias.codigoAcceso === String(codigo).trim();
};

module.exports = mongoose.model('Sala', salaSchema);

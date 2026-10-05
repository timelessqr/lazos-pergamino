// ===================================
// src/models/QR.js
// ===================================
const mongoose = require('mongoose');
const { QR_TYPES } = require('../utils/constants');

const qrSchema = new mongoose.Schema({
  // Codigo unico e inmutable impreso en el QR fisico de la sala
  code: {
    type: String,
    required: [true, 'El código QR es requerido'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [8, 'El código debe tener al menos 8 caracteres'],
    maxlength: [32, 'El código no puede exceder 32 caracteres']
  },

  // URL completa del pergamino publico
  url: {
    type: String,
    required: [true, 'La URL es requerida'],
    trim: true
  },

  tipo: {
    type: String,
    enum: Object.values(QR_TYPES),
    default: QR_TYPES.SALA,
    required: true
  },

  // Funeraria y sala dueñas del QR
  funerariaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Funeraria',
    required: [true, 'La funeraria es requerida']
  },
  salaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sala',
    required: [true, 'La sala es requerida'],
    unique: true
  },

  // Imagen del QR almacenada (opcional, puede generarse on-the-fly)
  imagenUrl: {
    type: String,
    trim: true
  },

  estadisticas: {
    vistas: { type: Number, default: 0, min: 0 },
    escaneos: { type: Number, default: 0, min: 0 },
    ultimaVisita: { type: Date, default: Date.now },
    visitasUnicas: [{
      ip: String,
      timestamp: { type: Date, default: Date.now },
      userAgent: String
    }]
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indices
qrSchema.index({ funerariaId: 1 });
qrSchema.index({ isActive: 1 });

// Incrementar vistas
qrSchema.methods.incrementViews = function() {
  this.estadisticas.vistas += 1;
  this.estadisticas.ultimaVisita = new Date();
  return this.save();
};

// Registrar escaneo unico (dedupe por IP en 24h)
qrSchema.methods.registrarEscaneo = function(ip, userAgent) {
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const visitaReciente = this.estadisticas.visitasUnicas.find(
    visita => visita.ip === ip && visita.timestamp > hace24h
  );

  if (!visitaReciente) {
    this.estadisticas.escaneos += 1;
    this.estadisticas.visitasUnicas.push({ ip, userAgent, timestamp: new Date() });

    // Mantener solo las ultimas 100 visitas para no saturar la BD
    if (this.estadisticas.visitasUnicas.length > 100) {
      this.estadisticas.visitasUnicas = this.estadisticas.visitasUnicas
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);
    }
  }

  return this.incrementViews();
};

module.exports = mongoose.model('QR', qrSchema);

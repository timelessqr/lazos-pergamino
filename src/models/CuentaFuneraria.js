// ===================================
// src/models/CuentaFuneraria.js
//
// Usuarios de una funeraria, con login propio en este backend.
//
// No viven en core-qr a propósito: core-qr no tiene roles y cualquier usuario
// suyo ve todos los memoriales. Estas cuentas solo existen acá, su token lo
// firma este backend con FUNERARIA_JWT_SECRET (core-qr no lo acepta) y solo
// llegan a los datos de su funeraria.
// ===================================
const mongoose = require('mongoose');

const cuentaFunerariaSchema = new mongoose.Schema({
  funerariaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Funeraria',
    required: [true, 'La funeraria es requerida'],
    index: true
  },

  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },

  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Email inválido']
  },

  // bcrypt; nunca sale en las consultas salvo que se pida con select('+passwordHash')
  passwordHash: {
    type: String,
    required: true,
    select: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Sube cuando cambia la contraseña: invalida los tokens emitidos antes
  versionToken: {
    type: Number,
    default: 0
  },

  ultimoAcceso: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CuentaFuneraria', cuentaFunerariaSchema);

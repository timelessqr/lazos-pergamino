// ===================================
// src/models/UsuarioFuneraria.js
//
// Mapeo local de identidad. core-qr es el dueño de las credenciales
// (email, password, login); este backend NO guarda contraseñas.
//
// El token de core-qr solo trae { userId }. Aquí traducimos ese userId
// a lo que este dominio necesita: qué rol tiene y de qué funeraria es.
// ===================================
const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

const usuarioFunerariaSchema = new mongoose.Schema({
  // _id del usuario en core-qr (viene en el claim `userId` del token)
  coreUserId: {
    type: String,
    required: [true, 'El userId de core-qr es requerido'],
    unique: true,
    trim: true,
    index: true
  },

  // Copia informativa para poder identificar al usuario en el panel.
  // La fuente de verdad sigue siendo core-qr.
  nombre: {
    type: String,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Email inválido']
  },

  // superadmin = dueño de la plataforma | funeraria = usuario de una funeraria
  rol: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.FUNERARIA,
    required: true
  },

  // Funeraria a la que pertenece (null para superadmin).
  // Es lo que usa el aislamiento entre funerarias.
  funerariaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Funeraria',
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  },
  ultimoAcceso: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indices
usuarioFunerariaSchema.index({ rol: 1 });
usuarioFunerariaSchema.index({ funerariaId: 1 });
usuarioFunerariaSchema.index({ isActive: 1 });

// Es superadmin
usuarioFunerariaSchema.methods.isSuperAdmin = function() {
  return this.rol === ROLES.SUPERADMIN;
};

module.exports = mongoose.model('UsuarioFuneraria', usuarioFunerariaSchema);

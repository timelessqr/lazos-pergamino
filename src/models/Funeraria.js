// ===================================
// src/models/Funeraria.js
// ===================================
const mongoose = require('mongoose');

const funerariaSchema = new mongoose.Schema({
  // Codigo legible generado automaticamente: FUN-001, FUN-002, ...
  codigo: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },

  nombre: {
    type: String,
    required: [true, 'El nombre de la funeraria es requerido'],
    trim: true,
    maxlength: [120, 'El nombre no puede exceder 120 caracteres']
  },
  razonSocial: {
    type: String,
    trim: true,
    maxlength: [150, 'La razón social no puede exceder 150 caracteres']
  },
  ruc: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [20, 'El RUC no puede exceder 20 caracteres']
  },

  // Contacto
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true,
    match: [/^[\d\-\+\(\)\s]+$/, 'Formato de teléfono inválido']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Email inválido']
  },
  direccion: {
    type: String,
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  ciudad: {
    type: String,
    trim: true,
    maxlength: [80, 'La ciudad no puede exceder 80 caracteres']
  },
  pais: {
    type: String,
    trim: true,
    maxlength: [80, 'El país no puede exceder 80 caracteres']
  },
  sitioWeb: {
    type: String,
    trim: true
  },

  // Personalizacion visual que heredan los pergaminos de sus salas
  branding: {
    logoUrl: { type: String, trim: true },
    colorPrimario: { type: String, trim: true, default: '#2C3E50' },
    colorSecundario: { type: String, trim: true, default: '#C9A227' },
    tipografia: { type: String, trim: true, default: 'serif' }
  },

  observaciones: {
    type: String,
    trim: true,
    maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres']
  },

  // Total de salas fijas de la funeraria (por defecto 4)
  totalSalas: {
    type: Number,
    default: 4,
    min: 1
  },

  activo: {
    type: Boolean,
    default: true
  },

  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indices
funerariaSchema.index({ nombre: 1 });
funerariaSchema.index({ ruc: 1 });
funerariaSchema.index({ activo: 1 });
funerariaSchema.index({ fechaRegistro: -1 });

// Generar codigo secuencial FUN-XXX
funerariaSchema.pre('save', async function(next) {
  if (this.isNew && !this.codigo) {
    let attempts = 0;
    const maxAttempts = 100;

    do {
      attempts++;

      const existing = await this.constructor
        .find({ codigo: { $regex: /^FUN-\d+$/ } }, { codigo: 1 })
        .lean();

      const numbers = existing.map(doc => {
        const match = doc.codigo.match(/^FUN-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });

      const nextNumber = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
      const codigoGenerado = `FUN-${String(nextNumber).padStart(3, '0')}`;

      const exists = await this.constructor.findOne({ codigo: codigoGenerado });
      if (!exists) {
        this.codigo = codigoGenerado;
        break;
      }
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return next(new Error('No se pudo generar un código único de funeraria'));
    }
  }

  if (this.isModified() && !this.isNew) {
    this.ultimaActualizacion = new Date();
  }

  next();
});

// Salas de la funeraria
funerariaSchema.virtual('salas', {
  ref: 'Sala',
  localField: '_id',
  foreignField: 'funerariaId'
});

// Informacion de contacto resumida
funerariaSchema.methods.getContactInfo = function() {
  return {
    nombre: this.nombre,
    codigo: this.codigo,
    telefono: this.telefono,
    email: this.email || 'No registrado',
    ciudad: this.ciudad || 'No registrada'
  };
};

// Busqueda por termino
funerariaSchema.statics.buscar = function(termino) {
  const regex = new RegExp(termino, 'i');
  return this.find({
    activo: true,
    $or: [{ nombre: regex }, { codigo: regex }, { ruc: regex }, { telefono: regex }, { email: regex }, { ciudad: regex }]
  });
};

module.exports = mongoose.model('Funeraria', funerariaSchema);

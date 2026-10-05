// ===================================
// src/models/Pergamino.js
// ===================================
const mongoose = require('mongoose');
const {
  PERGAMINO_TEMPLATES,
  PERGAMINO_STATUS,
  SECCIONES_PERGAMINO,
  TIPOS_SERVICIO
} = require('../utils/constants');

// Secciones por defecto del pergamino, en el orden en que se renderizan
// (replica el diseño fisico: encabezado > foto > fechas > frase > servicios > pie)
const seccionesDefault = () => ([
  { key: 'encabezado', visible: true, orden: 0, titulo: 'EN MEMORIA DE' },
  { key: 'retrato', visible: true, orden: 1, titulo: '' },
  { key: 'fechas', visible: true, orden: 2, titulo: '' },
  { key: 'frase', visible: true, orden: 3, titulo: '' },
  { key: 'servicios', visible: true, orden: 4, titulo: 'INFORMACIÓN DEL SERVICIO' },
  { key: 'galeria_fotos', visible: false, orden: 5, titulo: 'Galería' },
  { key: 'condolencias', visible: true, orden: 6, titulo: 'Libro de condolencias' },
  { key: 'pie_funeraria', visible: true, orden: 7, titulo: '' }
]);

// Servicios por defecto que trae todo pergamino nuevo, listos para editar
const serviciosDefault = () => ([
  { tipo: 'velatorio', titulo: 'VELATORIO', icono: 'calendario', orden: 0, visible: true },
  { tipo: 'ceremonia_religiosa', titulo: 'CEREMONIA RELIGIOSA', icono: 'iglesia', orden: 1, visible: true },
  { tipo: 'sepultura', titulo: 'DESPEDIDA Y SEPULTURA', icono: 'hoja', orden: 2, visible: true }
]);

// Un bloque de "INFORMACION DEL SERVICIO": icono + titulo + fecha/hora + lugar/direccion
const servicioSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: TIPOS_SERVICIO,
    default: 'otro'
  },
  // Texto del encabezado del bloque: "VELATORIO", "CEREMONIA RELIGIOSA", ...
  titulo: {
    type: String,
    trim: true,
    maxlength: [80, 'El título del servicio no puede exceder 80 caracteres']
  },
  // Icono que muestra el frontend: calendario | iglesia | hoja | flor | urna
  icono: {
    type: String,
    trim: true,
    default: 'calendario'
  },

  // Columna izquierda: fecha y hora
  fecha: { type: Date },
  // Texto tal cual se imprime: "Jueves 16 de mayo de 2024"
  fechaTexto: { type: String, trim: true, maxlength: 80 },
  // Texto tal cual se imprime: "15:00 a 22:00 hrs."
  horaTexto: { type: String, trim: true, maxlength: 60 },

  // Columna derecha: lugar y direccion
  lugar: { type: String, trim: true, maxlength: 120 },
  direccion: { type: String, trim: true, maxlength: 200 },

  orden: { type: Number, default: 0, min: 0 },
  visible: { type: Boolean, default: true }
}, { _id: true });

const pergaminoSchema = new mongoose.Schema({
  // Un pergamino pertenece a UNA sala (relacion 1:1) y a su funeraria
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

  // Plantilla visual elegida por la funeraria
  template: {
    type: String,
    enum: Object.values(PERGAMINO_TEMPLATES),
    default: PERGAMINO_TEMPLATES.CLASICO
  },

  // ----- ENCABEZADO -----
  encabezado: {
    // "EN MEMORIA DE"
    titulo: { type: String, trim: true, maxlength: 150, default: 'EN MEMORIA DE' },
    subtitulo: { type: String, trim: true, maxlength: 200 },
    // Adorno superior (rama, cruz, flor...)
    ornamento: { type: String, trim: true, default: 'rama' }
  },

  // ----- DIFUNTO -----
  difunto: {
    nombre: { type: String, trim: true, maxlength: 150 },
    apellido: { type: String, trim: true, maxlength: 150 },

    fechaNacimiento: { type: Date },
    fechaFallecimiento: { type: Date },
    // Texto ya formateado como se imprime: "10 ABRIL 1948  -  15 MAYO 2024"
    fechasTexto: { type: String, trim: true, maxlength: 120 },

    // Retrato ovalado central
    fotoUrl: { type: String, trim: true },
    // Marco decorativo del retrato: ovalo | circulo | rectangulo
    fotoMarco: { type: String, trim: true, default: 'ovalo' },

    biografia: { type: String, trim: true, maxlength: 5000 }
  },

  // ----- FRASE / EPITAFIO (cursiva bajo las fechas) -----
  frase: {
    type: String,
    trim: true,
    maxlength: [300, 'La frase no puede exceder 300 caracteres']
  },

  // ----- INFORMACION DEL SERVICIO -----
  serviciosTitulo: {
    type: String,
    trim: true,
    maxlength: 80,
    default: 'INFORMACIÓN DEL SERVICIO'
  },
  servicios: {
    type: [servicioSchema],
    default: serviciosDefault
  },

  // ----- PIE DE PAGINA -----
  pie: {
    // "FUNERARIA LAZOS DE VIDA"
    texto: { type: String, trim: true, maxlength: 150 },
    logoUrl: { type: String, trim: true },
    mostrarLogo: { type: Boolean, default: true }
  },

  // Texto libre adicional (opcional, oculto por defecto)
  mensaje: {
    type: String,
    trim: true,
    maxlength: [5000, 'El mensaje no puede exceder 5000 caracteres']
  },
  oracion: {
    type: String,
    trim: true,
    maxlength: [2000, 'La oración no puede exceder 2000 caracteres']
  },

  // Secciones visibles y su orden (permite ocultar/reordenar por funeraria)
  secciones: {
    type: [{
      key: { type: String, enum: SECCIONES_PERGAMINO, required: true },
      visible: { type: Boolean, default: true },
      orden: { type: Number, required: true, min: 0 },
      titulo: { type: String, trim: true, maxlength: 120 }
    }],
    default: seccionesDefault
  },

  // Estilos propios del pergamino (heredan del branding de la funeraria)
  estilos: {
    colorPrimario: { type: String, trim: true, default: '#8C7B5A' },
    colorTexto: { type: String, trim: true, default: '#4A443B' },
    colorFondo: { type: String, trim: true, default: '#F4F1E8' },
    tipografia: { type: String, trim: true, default: 'serif' },
    // Textura de fondo del pergamino (papel)
    fondoUrl: { type: String, trim: true },
    texturaPapel: { type: String, trim: true, default: 'papel_artesanal' }
  },

  estado: {
    type: String,
    enum: Object.values(PERGAMINO_STATUS),
    default: PERGAMINO_STATUS.BORRADOR
  },

  // Auditoria de edicion
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  ultimaEdicion: {
    type: Date,
    default: Date.now
  },
  fechaPublicacion: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indices
pergaminoSchema.index({ funerariaId: 1 });
pergaminoSchema.index({ estado: 1 });

// Subir version en cada edicion de contenido
pergaminoSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified()) {
    this.ultimaEdicion = new Date();

    const camposContenido = [
      'encabezado', 'difunto', 'frase', 'servicios', 'serviciosTitulo',
      'pie', 'mensaje', 'oracion', 'secciones', 'estilos', 'template'
    ];

    if (camposContenido.some(campo => this.isModified(campo))) {
      this.version += 1;
    }
  }

  next();
});

// Nombre completo del difunto
pergaminoSchema.virtual('nombreCompletoDifunto').get(function() {
  const nombre = this.difunto?.nombre || '';
  const apellido = this.difunto?.apellido || '';
  return `${nombre} ${apellido}`.trim();
});

// Servicios visibles ordenados, listos para render
pergaminoSchema.methods.serviciosVisibles = function() {
  return (this.servicios || [])
    .filter(servicio => servicio.visible)
    .sort((a, b) => a.orden - b.orden);
};

// Publicar el pergamino
pergaminoSchema.methods.publicar = function() {
  this.estado = PERGAMINO_STATUS.PUBLICADO;
  this.fechaPublicacion = new Date();
  return this.save();
};

// Archivar el pergamino (fin del velatorio)
pergaminoSchema.methods.archivar = function() {
  this.estado = PERGAMINO_STATUS.ARCHIVADO;
  return this.save();
};

// Restablecer el pergamino a su estado inicial (nueva ocupacion de la sala)
pergaminoSchema.methods.reiniciar = function() {
  this.encabezado = { titulo: 'EN MEMORIA DE', subtitulo: '', ornamento: 'rama' };
  this.difunto = { fotoMarco: 'ovalo' };
  this.frase = '';
  this.mensaje = '';
  this.oracion = '';
  this.servicios = serviciosDefault();
  this.secciones = seccionesDefault();
  this.estado = PERGAMINO_STATUS.BORRADOR;
  this.fechaPublicacion = undefined;
  return this.save();
};

module.exports = mongoose.model('Pergamino', pergaminoSchema);
module.exports.seccionesDefault = seccionesDefault;
module.exports.serviciosDefault = serviciosDefault;

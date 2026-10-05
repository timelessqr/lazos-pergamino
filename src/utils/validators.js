// ===================================
// src/utils/validators.js
// ===================================
const Joi = require('joi');
const {
  FORMATOS_PERMITIDOS,
  FILE_LIMITS,
  SALA_LIMITS,
  SECCIONES_PERGAMINO,
  PERGAMINO_TEMPLATES,
  TIPOS_SERVICIO,
  ICONOS_SERVICIO
} = require('./constants');

// Joi valida por defecto contra una lista cerrada de TLDs, lo que rechaza
// dominios internos y de pruebas (.test, .local). Aceptamos cualquier TLD.
const email = () => Joi.string().email({ minDomainSegments: 2, tlds: { allow: false } });

const schemas = {
  // ----- USUARIOS -----
  // No hay login ni registro con contraseña: core-qr emite el token.
  // Aquí solo se concede acceso a un usuario que ya existe en core-qr.
  usuarioAcceso: Joi.object({
    coreUserId: Joi.string().trim().required().messages({
      'any.required': 'El coreUserId (userId de core-qr) es requerido'
    }),
    nombre: Joi.string().min(2).max(100).trim().optional().allow(''),
    email: email().lowercase().trim().optional().allow(''),
    rol: Joi.string().valid('superadmin', 'funeraria').optional(),
    funerariaId: Joi.string().hex().length(24).optional().allow(null, '')
  }),

  usuarioUpdate: Joi.object({
    nombre: Joi.string().min(2).max(100).trim().optional().allow(''),
    email: email().lowercase().trim().optional().allow(''),
    rol: Joi.string().valid('superadmin', 'funeraria').optional(),
    funerariaId: Joi.string().hex().length(24).optional().allow(null, ''),
    isActive: Joi.boolean().optional()
  }),

  // ----- FUNERARIA -----
  funeraria: Joi.object({
    nombre: Joi.string().min(2).max(120).trim().required().messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'any.required': 'El nombre de la funeraria es requerido'
    }),
    razonSocial: Joi.string().max(150).trim().optional().allow(''),
    ruc: Joi.string().max(20).trim().optional().allow(''),
    telefono: Joi.string().pattern(/^[\d\-\+\(\)\s]+$/).min(7).max(20).trim().required().messages({
      'string.pattern.base': 'Formato de teléfono inválido',
      'any.required': 'El teléfono es requerido'
    }),
    email: email().lowercase().trim().optional().allow(''),
    direccion: Joi.string().max(200).trim().optional().allow(''),
    ciudad: Joi.string().max(80).trim().optional().allow(''),
    pais: Joi.string().max(80).trim().optional().allow(''),
    sitioWeb: Joi.string().uri().trim().optional().allow(''),
    observaciones: Joi.string().max(500).trim().optional().allow(''),
    branding: Joi.object({
      logoUrl: Joi.string().trim().optional().allow(''),
      colorPrimario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(''),
      colorSecundario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(''),
      tipografia: Joi.string().max(60).trim().optional().allow('')
    }).optional()
  }),

  funerariaUpdate: Joi.object({
    nombre: Joi.string().min(2).max(120).trim().optional(),
    razonSocial: Joi.string().max(150).trim().optional().allow(''),
    ruc: Joi.string().max(20).trim().optional().allow(''),
    telefono: Joi.string().pattern(/^[\d\-\+\(\)\s]+$/).min(7).max(20).trim().optional(),
    email: email().lowercase().trim().optional().allow(''),
    direccion: Joi.string().max(200).trim().optional().allow(''),
    ciudad: Joi.string().max(80).trim().optional().allow(''),
    pais: Joi.string().max(80).trim().optional().allow(''),
    sitioWeb: Joi.string().uri().trim().optional().allow(''),
    observaciones: Joi.string().max(500).trim().optional().allow(''),
    activo: Joi.boolean().optional(),
    branding: Joi.object({
      logoUrl: Joi.string().trim().optional().allow(''),
      colorPrimario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(''),
      colorSecundario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(''),
      tipografia: Joi.string().max(60).trim().optional().allow('')
    }).optional()
  }),

  // ----- SALA -----
  salaUpdate: Joi.object({
    nombre: Joi.string().min(1).max(80).trim().optional(),
    descripcion: Joi.string().max(300).trim().optional().allow(''),
    capacidad: Joi.number().integer().min(0).max(2000).optional(),
    ubicacion: Joi.string().max(150).trim().optional().allow(''),
    activa: Joi.boolean().optional()
  }),

  // ----- PERGAMINO -----
  pergaminoUpdate: Joi.object({
    template: Joi.string().valid(...Object.values(PERGAMINO_TEMPLATES)).optional(),

    encabezado: Joi.object({
      titulo: Joi.string().max(150).trim().optional().allow(''),
      subtitulo: Joi.string().max(200).trim().optional().allow(''),
      ornamento: Joi.string().max(40).trim().optional().allow('')
    }).optional(),

    difunto: Joi.object({
      nombre: Joi.string().max(150).trim().optional().allow(''),
      apellido: Joi.string().max(150).trim().optional().allow(''),
      fechaNacimiento: Joi.date().max('now').optional().allow(null, ''),
      fechaFallecimiento: Joi.date().max('now').optional().allow(null, ''),
      fechasTexto: Joi.string().max(120).trim().optional().allow(''),
      fotoUrl: Joi.string().trim().optional().allow(''),
      fotoMarco: Joi.string().valid('ovalo', 'circulo', 'rectangulo').optional(),
      biografia: Joi.string().max(SALA_LIMITS.mensaje).trim().optional().allow('')
    }).optional(),

    frase: Joi.string().max(300).trim().optional().allow(''),

    serviciosTitulo: Joi.string().max(80).trim().optional().allow(''),
    servicios: Joi.array().items(
      Joi.object({
        _id: Joi.string().hex().length(24).optional(),
        tipo: Joi.string().valid(...TIPOS_SERVICIO).optional(),
        titulo: Joi.string().max(80).trim().optional().allow(''),
        icono: Joi.string().valid(...ICONOS_SERVICIO).optional(),
        fecha: Joi.date().optional().allow(null, ''),
        fechaTexto: Joi.string().max(80).trim().optional().allow(''),
        horaTexto: Joi.string().max(60).trim().optional().allow(''),
        lugar: Joi.string().max(120).trim().optional().allow(''),
        direccion: Joi.string().max(200).trim().optional().allow(''),
        orden: Joi.number().integer().min(0).optional(),
        visible: Joi.boolean().optional()
      })
    ).max(10).optional(),

    pie: Joi.object({
      texto: Joi.string().max(150).trim().optional().allow(''),
      logoUrl: Joi.string().trim().optional().allow(''),
      mostrarLogo: Joi.boolean().optional()
    }).optional(),

    mensaje: Joi.string().max(SALA_LIMITS.mensaje).trim().optional().allow(''),
    oracion: Joi.string().max(2000).trim().optional().allow(''),

    secciones: Joi.array().items(
      Joi.object({
        key: Joi.string().valid(...SECCIONES_PERGAMINO).required(),
        visible: Joi.boolean().default(true),
        orden: Joi.number().integer().min(0).required(),
        titulo: Joi.string().max(120).trim().optional().allow('')
      })
    ).optional(),

    estilos: Joi.object({
      colorPrimario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(''),
      colorTexto: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(''),
      colorFondo: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(''),
      tipografia: Joi.string().max(60).trim().optional().allow(''),
      fondoUrl: Joi.string().trim().optional().allow(''),
      texturaPapel: Joi.string().max(60).trim().optional().allow('')
    }).optional(),

    estado: Joi.string().valid('borrador', 'publicado', 'archivado').optional()
  }),

  // Alta/edicion de un unico bloque de servicio
  servicio: Joi.object({
    tipo: Joi.string().valid(...TIPOS_SERVICIO).optional(),
    titulo: Joi.string().max(80).trim().required().messages({
      'any.required': 'El título del servicio es requerido'
    }),
    icono: Joi.string().valid(...ICONOS_SERVICIO).optional(),
    fecha: Joi.date().optional().allow(null, ''),
    fechaTexto: Joi.string().max(80).trim().optional().allow(''),
    horaTexto: Joi.string().max(60).trim().optional().allow(''),
    lugar: Joi.string().max(120).trim().optional().allow(''),
    direccion: Joi.string().max(200).trim().optional().allow(''),
    orden: Joi.number().integer().min(0).optional(),
    visible: Joi.boolean().optional()
  }),

  // ----- CONDOLENCIAS -----
  condolencia: Joi.object({
    nombre: Joi.string().min(2).max(100).trim().required().messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'any.required': 'Tu nombre es requerido'
    }),
    relacion: Joi.string().max(80).trim().optional().allow(''),
    mensaje: Joi.string().min(3).max(SALA_LIMITS.condolenciaMensaje).trim().required().messages({
      'string.min': 'El mensaje es demasiado corto',
      'any.required': 'El mensaje es requerido'
    }),
    email: email().lowercase().trim().optional().allow('')
  }),

  condolenciasConfig: Joi.object({
    habilitado: Joi.boolean().optional(),
    requiereCodigo: Joi.boolean().optional(),
    codigoAcceso: Joi.string().min(4).max(20).trim().optional().allow(''),
    requiereModeracion: Joi.boolean().optional(),
    mensajeBienvenida: Joi.string().max(300).trim().optional().allow('')
  }),

  validarCodigo: Joi.object({
    codigo: Joi.string().trim().required().messages({
      'any.required': 'El código de acceso es requerido'
    })
  }),

  // ----- MEDIA -----
  mediaUpload: Joi.object({
    titulo: Joi.string().max(100).trim().optional().allow(''),
    descripcion: Joi.string().max(500).trim().optional().allow(''),
    seccion: Joi.string().valid('galeria_fotos', 'retrato', 'encabezado', 'pie_funeraria').required(),
    tags: Joi.array().items(Joi.string().max(30).trim()).optional()
  })
};

/**
 * Middleware de validacion
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const { responseHelper } = require('./responseHelper');
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return responseHelper.validationError(res, errors);
    }

    next();
  };
};

/**
 * Validador de archivos
 */
const validateFile = (tipo) => {
  return (req, res, next) => {
    const { responseHelper } = require('./responseHelper');

    if (!req.file) {
      return responseHelper.error(res, 'No se proporcionó archivo', 400);
    }

    const file = req.file;
    const extension = file.originalname.split('.').pop().toLowerCase();
    const formatosPermitidos = FORMATOS_PERMITIDOS[tipo] || [];

    if (!formatosPermitidos.includes(extension)) {
      return responseHelper.error(
        res,
        `Formato no permitido. Use: ${formatosPermitidos.join(', ')}`,
        400
      );
    }

    const maxSize = tipo === 'fotos' ? FILE_LIMITS.FOTO_MAX_SIZE : FILE_LIMITS.VIDEO_MAX_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
      return responseHelper.error(res, `Archivo demasiado grande. Máximo: ${maxSizeMB}MB`, 400);
    }

    next();
  };
};

/**
 * Validador programatico de funeraria (usado desde el service)
 */
const validateFuncrariaData = (data, isUpdate = false) => {
  const schema = isUpdate ? schemas.funerariaUpdate : schemas.funeraria;
  return schema.validate(data, { abortEarly: false, stripUnknown: true });
};

/**
 * Validador programatico de pergamino (usado desde el service)
 */
const validatePergaminoData = (data) => {
  return schemas.pergaminoUpdate.validate(data, { abortEarly: false, stripUnknown: true });
};

/**
 * Validador programatico de condolencia (usado desde el service)
 */
const validateCondolenciaData = (data) => {
  return schemas.condolencia.validate(data, { abortEarly: false, stripUnknown: true });
};

module.exports = {
  schemas,
  validate,
  validateFile,
  validateFuncrariaData,
  validateFunerariaData: validateFuncrariaData,
  validatePergaminoData,
  validateCondolenciaData
};

// ===================================
// src/utils/constants.js
// ===================================
module.exports = {
  // 🏛️ REGLAS DE NEGOCIO
  BUSINESS: {
    // Cada funeraria tiene SIEMPRE este numero de salas fijas
    SALAS_POR_FUNERARIA: parseInt(process.env.SALAS_POR_FUNERARIA) || 4,
    // Cada sala tiene 1 QR fijo, 1 pergamino editable y 1 libro de condolencias
    QRS_POR_SALA: 1
  },

  // 🚪 NOMBRES POR DEFECTO DE LAS SALAS
  SALAS_DEFAULT: [
    { numero: 1, nombre: 'Sala 1' },
    { numero: 2, nombre: 'Sala 2' },
    { numero: 3, nombre: 'Sala 3' },
    { numero: 4, nombre: 'Sala 4' }
  ],

  // 👤 ROLES
  ROLES: {
    SUPERADMIN: 'superadmin',
    FUNERARIA: 'funeraria'
  },

  // 📱 TIPOS DE QR
  QR_TYPES: {
    SALA: 'sala'
  },

  // 📜 SECCIONES EDITABLES DEL PERGAMINO (en orden de render del diseno)
  SECCIONES_PERGAMINO: [
    'encabezado',      // "EN MEMORIA DE" + nombre completo
    'retrato',         // foto ovalada del difunto
    'fechas',          // "10 ABRIL 1948 - 15 MAYO 2024"
    'frase',           // epitafio en cursiva
    'servicios',       // bloque "INFORMACION DEL SERVICIO"
    'galeria_fotos',   // galeria opcional
    'mensaje',         // texto libre opcional
    'oracion',         // oracion opcional
    'condolencias',    // libro de condolencias de la sala
    'pie_funeraria'    // logo + nombre de la funeraria
  ],

  // ⛪ TIPOS DE BLOQUE DENTRO DE "INFORMACION DEL SERVICIO"
  TIPOS_SERVICIO: [
    'velatorio',
    'ceremonia_religiosa',
    'misa',
    'cremacion',
    'sepultura',
    'responso',
    'otro'
  ],

  // 🎨 ICONOS DISPONIBLES PARA LOS SERVICIOS
  ICONOS_SERVICIO: ['calendario', 'iglesia', 'hoja', 'flor', 'urna', 'cruz', 'reloj'],

  // 🎨 PLANTILLAS DE PERGAMINO
  PERGAMINO_TEMPLATES: {
    CLASICO: 'clasico',
    MODERNO: 'moderno',
    ELEGANTE: 'elegante',
    SOBRIO: 'sobrio'
  },

  // 📊 ESTADOS DEL PERGAMINO
  PERGAMINO_STATUS: {
    BORRADOR: 'borrador',
    PUBLICADO: 'publicado',
    ARCHIVADO: 'archivado'
  },

  // 💬 ESTADOS DE CONDOLENCIA
  CONDOLENCIA_STATUS: {
    PENDIENTE: 'pendiente',
    APROBADA: 'aprobada',
    RECHAZADA: 'rechazada'
  },

  // 📄 FORMATOS DE ARCHIVO PERMITIDOS
  FORMATOS_PERMITIDOS: {
    fotos: ['jpg', 'jpeg', 'png', 'webp'],
    videos: ['mp4']
  },

  // 📏 LIMITES DE ARCHIVO
  FILE_LIMITS: {
    FOTO_MAX_SIZE: (parseInt(process.env.MAX_PHOTO_SIZE_MB) || 5) * 1024 * 1024,
    VIDEO_MAX_SIZE: (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024,
    QR_IMAGE_SIZE: parseInt(process.env.QR_IMAGE_SIZE) || 512,
    QR_IMAGE_QUALITY: parseFloat(process.env.QR_IMAGE_QUALITY) || 0.92
  },

  // 📦 LIMITES POR SALA
  SALA_LIMITS: {
    fotos: parseInt(process.env.SALA_MAX_PHOTOS) || 50,
    almacenamiento: (parseInt(process.env.SALA_MAX_STORAGE_MB) || 500) * 1024 * 1024,
    mensaje: 5000,
    condolenciaMensaje: 1000
  },

  // 🔐 CONFIGURACION DE SEGURIDAD
  SECURITY: {
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    JWT_SECRET: process.env.JWT_SECRET,
    // Firma los tokens de las cuentas de funeraria. Distinto del de core-qr:
    // core-qr no acepta esos tokens
    FUNERARIA_JWT_SECRET: process.env.FUNERARIA_JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    // Por IP cada 15 min, para toda la API. Una pantalla del panel hace varios
    // pedidos (salas + 4 QR...): con 100 una funeraria trabajando chocaba el límite
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
  },

  // 🌐 URLs
  URLS: {
    FRONTEND: process.env.FRONTEND_URL || 'http://localhost:5173',
    QR_BASE: process.env.QR_BASE_URL || 'http://localhost:5173/pergamino'
  },

  // 📊 ESTADOS DE PROCESAMIENTO
  PROCESSING_STATUS: {
    PENDING: 'procesando',
    COMPLETED: 'completado',
    ERROR: 'error'
  },

  // 📝 MENSAJES DE RESPUESTA
  MESSAGES: {
    SUCCESS: {
      LOGIN_SUCCESS: 'Login exitoso',
      FUNERARIA_CREATED: 'Funeraria registrada exitosamente con sus 4 salas y QR',
      FUNERARIA_UPDATED: 'Funeraria actualizada',
      FUNERARIA_DELETED: 'Funeraria eliminada',
      SALA_UPDATED: 'Sala actualizada',
      PERGAMINO_UPDATED: 'Pergamino actualizado',
      PERGAMINO_PUBLISHED: 'Pergamino publicado',
      QR_GENERATED: 'Código QR generado exitosamente',
      CONDOLENCIA_CREATED: 'Condolencia registrada, gracias por tu mensaje'
    },
    ERROR: {
      USER_EXISTS: 'El email ya está registrado',
      INVALID_CREDENTIALS: 'Credenciales inválidas',
      USER_NOT_FOUND: 'Usuario no encontrado',
      FUNERARIA_NOT_FOUND: 'Funeraria no encontrada',
      FUNERARIA_EXISTS: 'Ya existe una funeraria con ese RUC/identificador',
      SALA_NOT_FOUND: 'Sala no encontrada',
      PERGAMINO_NOT_FOUND: 'Pergamino no encontrado',
      CONDOLENCIA_NOT_FOUND: 'Condolencia no encontrada',
      QR_NOT_FOUND: 'Código QR no válido',
      QR_INACTIVE: 'Este código QR está desactivado',
      UNAUTHORIZED: 'No autorizado',
      FORBIDDEN: 'No tienes permisos sobre este recurso',
      INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
      FILE_TOO_LARGE: 'Archivo demasiado grande',
      SALA_LIMIT_REACHED: 'Límite de la sala alcanzado',
      CONDOLENCIAS_CERRADAS: 'El libro de condolencias está cerrado',
      CODIGO_INVALIDO: 'Código de acceso inválido'
    }
  }
};

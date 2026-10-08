// ===================================
// src/middleware/auth.js
//
// Acepta dos clases de token:
//   - El de core-qr (admin de Lazos): se verifica con JWT_SECRET y su `userId`
//     se traduce a rol + funerariaId con la colección `usuariofunerarias`.
//   - El de una cuenta de funeraria (tipo 'funeraria'): lo firma este backend
//     al hacer login, con FUNERARIA_JWT_SECRET. Solo da acceso a su funeraria.
// ===================================
const jwt = require('jsonwebtoken');
const UsuarioFuneraria = require('../models/UsuarioFuneraria');
const CuentaFuneraria = require('../models/CuentaFuneraria');
const Funeraria = require('../models/Funeraria');
const { responseHelper } = require('../utils/responseHelper');
const { SECURITY, MESSAGES, ROLES } = require('../utils/constants');

/**
 * Verifica el token emitido por core-qr y resuelve la identidad local
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return responseHelper.unauthorized(res, MESSAGES.ERROR.UNAUTHORIZED);
    }

    const token = authHeader.replace('Bearer ', '');

    // decode no valida nada: solo elige con qué secreto verificar
    if (jwt.decode(token)?.tipo === 'funeraria') {
      return await autenticarCuentaFuneraria(token, req, res, next);
    }

    // core-qr firma { userId }; aceptamos tambien `sub` o `id` por si cambia
    const decoded = jwt.verify(token, SECURITY.JWT_SECRET);
    const coreUserId = decoded.userId || decoded.sub || decoded.id;

    if (!coreUserId) {
      return responseHelper.unauthorized(res, 'El token no identifica a ningún usuario');
    }

    // Traducir el usuario de core-qr a la identidad de este dominio
    const usuario = await UsuarioFuneraria.findOne({
      coreUserId: String(coreUserId),
      isActive: true
    });

    if (!usuario) {
      return responseHelper.forbidden(
        res,
        'El usuario está autenticado pero no tiene acceso a esta plataforma'
      );
    }

    req.user = {
      id: usuario._id,
      tipo: 'core',
      coreUserId: usuario.coreUserId,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      funerariaId: usuario.funerariaId
    };

    // Registro de último acceso sin bloquear la petición
    UsuarioFuneraria.updateOne(
      { _id: usuario._id },
      { ultimoAcceso: new Date() }
    ).catch(err => console.error('No se pudo registrar el último acceso:', err.message));

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return responseHelper.unauthorized(res, 'Token inválido');
    }

    if (error.name === 'TokenExpiredError') {
      return responseHelper.unauthorized(res, 'Token expirado');
    }

    console.error('Error en middleware auth:', error);
    responseHelper.unauthorized(res, MESSAGES.ERROR.UNAUTHORIZED);
  }
};

/**
 * Token de una cuenta de funeraria: firmado por este backend
 */
const autenticarCuentaFuneraria = async (token, req, res, next) => {
  if (!SECURITY.FUNERARIA_JWT_SECRET) {
    return responseHelper.unauthorized(res, 'El login de funerarias no está configurado');
  }

  const decoded = jwt.verify(token, SECURITY.FUNERARIA_JWT_SECRET);
  const cuenta = await CuentaFuneraria.findById(decoded.sub);

  // Contraseña cambiada o cuenta desactivada después de emitir el token
  if (!cuenta || !cuenta.isActive || decoded.v !== cuenta.versionToken) {
    return responseHelper.unauthorized(res, 'La sesión ya no es válida, vuelve a iniciar sesión');
  }

  const funeraria = await Funeraria.findById(cuenta.funerariaId).select('activo').lean();
  if (!funeraria || funeraria.activo === false) {
    return responseHelper.forbidden(res, 'La funeraria está desactivada');
  }

  req.user = {
    id: cuenta._id,
    tipo: 'cuenta',
    nombre: cuenta.nombre,
    email: cuenta.email,
    rol: ROLES.FUNERARIA,
    funerariaId: cuenta.funerariaId
  };

  next();
};

/**
 * Restringe la ruta a los roles indicados
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseHelper.unauthorized(res, MESSAGES.ERROR.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.rol)) {
      return responseHelper.forbidden(res, MESSAGES.ERROR.FORBIDDEN);
    }

    next();
  };
};

/**
 * Solo superadmin (dueño de la plataforma)
 */
const requireSuperAdmin = requireRole(ROLES.SUPERADMIN);

/**
 * Extrae la funeraria solicitada de la peticion.
 * Las rutas la nombran `funerariaId` cuando esta anidada
 * (/funerarias/:funerariaId/salas) o `id` cuando la funeraria ES el recurso
 * (/funerarias/:id). Hay que mirar ambos o el scope no se aplica.
 */
const getFunerariaSolicitada = (req) => {
  return req.params.funerariaId
    || req.params.id
    || req.body.funerariaId
    || req.query.funerariaId
    || null;
};

/**
 * Garantiza que el usuario solo opere sobre SU funeraria.
 * El superadmin pasa siempre; el usuario funeraria queda acotado a su funerariaId.
 * Deja el scope resuelto en req.funerariaScope.
 */
const scopeFuneraria = (req, res, next) => {
  if (!req.user) {
    return responseHelper.unauthorized(res, MESSAGES.ERROR.UNAUTHORIZED);
  }

  if (req.user.rol === ROLES.SUPERADMIN) {
    req.funerariaScope = getFunerariaSolicitada(req);
    return next();
  }

  if (!req.user.funerariaId) {
    return responseHelper.forbidden(res, 'El usuario no tiene funeraria asignada');
  }

  const solicitada = getFunerariaSolicitada(req);

  if (solicitada && String(solicitada) !== String(req.user.funerariaId)) {
    return responseHelper.forbidden(res, MESSAGES.ERROR.FORBIDDEN);
  }

  req.funerariaScope = String(req.user.funerariaId);
  next();
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.requireSuperAdmin = requireSuperAdmin;
module.exports.scopeFuneraria = scopeFuneraria;
module.exports.getFunerariaSolicitada = getFunerariaSolicitada;

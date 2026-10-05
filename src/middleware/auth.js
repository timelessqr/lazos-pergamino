// ===================================
// src/middleware/auth.js
//
// La autenticación la maneja core-qr: él emite el token tras el login.
// Este backend NO emite tokens ni guarda contraseñas; solo:
//   1. verifica la firma del JWT (mismo JWT_SECRET que core-qr)
//   2. traduce el `userId` del token a rol + funerariaId mirando la
//      colección local `usuariofunerarias`
// ===================================
const jwt = require('jsonwebtoken');
const UsuarioFuneraria = require('../models/UsuarioFuneraria');
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

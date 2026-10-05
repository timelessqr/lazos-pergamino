// ===================================
// src/middleware/ownership.js
// Aislamiento entre funerarias (multi-tenant).
//
// scopeFuneraria (middleware/auth.js) solo compara la funeraria pedida
// EXPLICITAMENTE en la peticion. Pero rutas como /salas/:id o /pergaminos/:id
// identifican el recurso por su propio id: hay que ir a la base, averiguar de
// que funeraria es y compararlo. Eso es lo que hace este middleware.
// ===================================
const mongoose = require('mongoose');
const { responseHelper } = require('../utils/responseHelper');
const { MESSAGES, ROLES } = require('../utils/constants');

const Sala = require('../models/Sala');
const QR = require('../models/QR');
const Pergamino = require('../models/Pergamino');
const Condolencia = require('../models/Condolencia');
const Media = require('../models/Media');

// Cómo averiguar la funeraria dueña de cada tipo de recurso
const RESOLVERS = {
  sala: async (id) => (await Sala.findById(id).select('funerariaId').lean())?.funerariaId,
  qr: async (id) => (await QR.findById(id).select('funerariaId').lean())?.funerariaId,
  pergamino: async (id) => (await Pergamino.findById(id).select('funerariaId').lean())?.funerariaId,
  condolencia: async (id) => (await Condolencia.findById(id).select('funerariaId').lean())?.funerariaId,
  media: async (id) => (await Media.findById(id).select('funerariaId').lean())?.funerariaId
};

/**
 * Verifica que el recurso identificado por `param` pertenezca a la funeraria
 * del usuario. El superadmin pasa siempre.
 *
 * @param {string} tipo   sala | qr | pergamino | condolencia | media
 * @param {string} param  nombre del parámetro de ruta que trae el id
 */
const requireOwnership = (tipo, param = 'id') => {
  const resolver = RESOLVERS[tipo];

  if (!resolver) {
    throw new Error(`Tipo de recurso desconocido en requireOwnership: ${tipo}`);
  }

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return responseHelper.unauthorized(res, MESSAGES.ERROR.UNAUTHORIZED);
      }

      const id = req.params[param];

      if (!id || !mongoose.isValidObjectId(id)) {
        return responseHelper.error(res, `El parámetro ${param} no es un ID válido`, 400);
      }

      const funerariaId = await resolver(id);

      if (!funerariaId) {
        return responseHelper.notFound(res, 'Recurso no encontrado');
      }

      // El superadmin opera sobre cualquier funeraria, pero dejamos resuelto
      // el scope para que los controllers puedan usarlo igual.
      if (req.user.rol === ROLES.SUPERADMIN) {
        req.funerariaScope = String(funerariaId);
        return next();
      }

      if (String(funerariaId) !== String(req.user.funerariaId)) {
        return responseHelper.forbidden(res, MESSAGES.ERROR.FORBIDDEN);
      }

      req.funerariaScope = String(funerariaId);
      next();
    } catch (error) {
      console.error('Error verificando propiedad del recurso:', error);
      responseHelper.error(res, 'Error verificando permisos', 500);
    }
  };
};

module.exports = { requireOwnership };

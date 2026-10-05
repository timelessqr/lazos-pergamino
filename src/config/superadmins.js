// ===================================
// src/config/superadmins.js
// Alta de superadmins desde la variable SUPERADMIN_CORE_USER_IDS.
//
// /api/usuarios exige ser superadmin, así que el primero no se puede crear por
// la API. En un servidor sin consola (Render free) tampoco se puede correr
// registrar-superadmin.js, así que se hace al arrancar.
//
// Solo agrega o reactiva: quitar un id de la variable NO le quita el acceso.
// Para revocar, DELETE /api/usuarios/:id.
// ===================================
const mongoose = require('mongoose');
const UsuarioFuneraria = require('../models/UsuarioFuneraria');
const { ROLES } = require('../utils/constants');

const asegurarSuperadmins = async () => {
  const ids = (process.env.SUPERADMIN_CORE_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  let asegurados = 0;

  for (const coreUserId of ids) {
    if (!mongoose.isValidObjectId(coreUserId)) {
      console.error(`⚠️  SUPERADMIN_CORE_USER_IDS: "${coreUserId}" no es un id de core-qr válido`);
      continue;
    }

    await UsuarioFuneraria.findOneAndUpdate(
      { coreUserId },
      { coreUserId, rol: ROLES.SUPERADMIN, funerariaId: null, isActive: true },
      { upsert: true, runValidators: true }
    );
    asegurados += 1;
  }

  if (asegurados) {
    console.log(`🔐 Superadmins asegurados desde SUPERADMIN_CORE_USER_IDS: ${asegurados}`);
  }
};

module.exports = { asegurarSuperadmins };

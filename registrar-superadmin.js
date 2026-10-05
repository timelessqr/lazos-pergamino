// ===================================
// registrar-superadmin.js
// Da acceso de superadmin a un usuario de core-qr.
//
// Hace falta una vez por base: /api/usuarios exige ser superadmin, así que el
// primero no se puede crear por la API. El userId es el _id del usuario en la
// colección `users` de core-qr (el mismo que viaja en su token).
//
// Uso: node registrar-superadmin.js <coreUserId> [email] [nombre]
// ===================================
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const [coreUserId, email, nombre] = process.argv.slice(2);

  if (!coreUserId || !mongoose.isValidObjectId(coreUserId)) {
    console.error('Uso: node registrar-superadmin.js <coreUserId> [email] [nombre]');
    console.error('coreUserId es el _id del usuario en core-qr (24 caracteres hex).');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const UsuarioFuneraria = require('./src/models/UsuarioFuneraria');
    const { ROLES } = require('./src/utils/constants');

    const usuario = await UsuarioFuneraria.findOneAndUpdate(
      { coreUserId },
      {
        coreUserId,
        rol: ROLES.SUPERADMIN,
        funerariaId: null,
        isActive: true,
        ...(email && { email }),
        ...(nombre && { nombre })
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`✅ ${usuario.coreUserId} es superadmin en ${mongoose.connection.name}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

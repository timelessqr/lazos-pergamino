// ===================================
// clear-database.js
// Vacía todas las colecciones del dominio. NO usar en producción.
// Uso: npm run clear:db
// ===================================
require('dotenv').config();
const mongoose = require('mongoose');

const COLECCIONES = ['usuariofunerarias', 'funerarias', 'salas', 'qrs', 'pergaminos', 'condolencias', 'media'];

(async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Este script no puede ejecutarse en producción');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Conectado a: ${mongoose.connection.name}\n`);

    for (const nombre of COLECCIONES) {
      const result = await mongoose.connection.db.collection(nombre).deleteMany({});
      console.log(`   🗑️  ${nombre.padEnd(15)} → ${result.deletedCount} eliminados`);
    }

    console.log('\n✅ Base de datos limpia\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

// ===================================
// check-database.js
// Muestra el estado de las colecciones del dominio.
// Uso: npm run check:db
// ===================================
require('dotenv').config();
const mongoose = require('mongoose');

const COLECCIONES = ['usuariofunerarias', 'funerarias', 'salas', 'qrs', 'pergaminos', 'condolencias', 'media'];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Conectado a: ${mongoose.connection.name}\n`);

    console.log('📚 COLECCIONES');
    console.log('─'.repeat(40));

    for (const nombre of COLECCIONES) {
      const total = await mongoose.connection.db.collection(nombre).countDocuments();
      console.log(`   ${nombre.padEnd(15)} → ${total} documentos`);
    }

    // Verificar la regla de negocio: cada funeraria debe tener sus 4 salas
    const Funeraria = require('./src/models/Funeraria');
    const Sala = require('./src/models/Sala');

    const funerarias = await Funeraria.find({}).lean();

    if (funerarias.length > 0) {
      console.log('\n🏛️  FUNERARIAS Y SUS SALAS');
      console.log('─'.repeat(40));

      for (const funeraria of funerarias) {
        const salas = await Sala.countDocuments({ funerariaId: funeraria._id });
        const ok = salas === funeraria.totalSalas ? '✅' : '⚠️ ';

        console.log(`   ${ok} ${funeraria.codigo} ${funeraria.nombre} → ${salas}/${funeraria.totalSalas} salas`);
      }
    }

    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

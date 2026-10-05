// ===================================
// seed-demo.js
// Crea datos de demostración: 1 funeraria con sus 4 salas,
// y deja el pergamino de la Sala 1 publicado con un servicio completo.
// Uso: node seed-demo.js
// ===================================
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Este script no puede ejecutarse en producción');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const funerariaService = require('./src/modules/funerarias/services/funerariaService');
    const pergaminoService = require('./src/modules/pergaminos/services/pergaminoService');

    const result = await funerariaService.registerFuneraria({
      nombre: 'Funeraria Lazos de Vida',
      telefono: '+56 9 1234 5678',
      email: 'contacto@lazosdevida.cl',
      direccion: 'Av. Los Carrera 1234',
      ciudad: 'Rancagua',
      pais: 'Chile',
      branding: { colorPrimario: '#8C7B5A', colorSecundario: '#C9A227', tipografia: 'serif' }
    });

    console.log(`\n🏛️  ${result.funeraria.codigo} ${result.funeraria.nombre}`);
    result.salas.forEach(sala => {
      console.log(`   Sala ${sala.numero} → QR ${sala.qr.code} → ${sala.qr.url}`);
    });

    // Pergamino de ejemplo en la Sala 1
    const sala1 = result.salas[0];

    await pergaminoService.updatePergamino(sala1.pergaminoId, {
      difunto: {
        nombre: 'Raúl Esteban',
        apellido: 'Martínez González',
        fechaNacimiento: '1948-04-10',
        fechaFallecimiento: '2024-05-15',
        fechasTexto: '10 ABRIL 1948  -  15 MAYO 2024',
        fotoMarco: 'ovalo'
      },
      frase: 'Tu amor y tu ejemplo vivirán por siempre en nuestros corazones.',
      servicios: [
        {
          tipo: 'velatorio', titulo: 'VELATORIO', icono: 'calendario',
          fechaTexto: 'Jueves 16 de mayo de 2024', horaTexto: '15:00 a 22:00 hrs.',
          lugar: 'Salón Lazos de Vida', direccion: 'Av. Los Carrera 1234, Rancagua', orden: 0
        },
        {
          tipo: 'ceremonia_religiosa', titulo: 'CEREMONIA RELIGIOSA', icono: 'iglesia',
          fechaTexto: 'Viernes 17 de mayo de 2024', horaTexto: '11:00 hrs.',
          lugar: 'Parroquia San Francisco', direccion: 'Estado 567, Rancagua', orden: 1
        },
        {
          tipo: 'sepultura', titulo: 'DESPEDIDA Y SEPULTURA', icono: 'hoja',
          fechaTexto: 'Viernes 17 de mayo de 2024', horaTexto: '12:30 hrs.',
          lugar: 'Cementerio Parque Jardines de la Paz', direccion: 'Ruta 5 Sur Km. 96, Rancagua', orden: 2
        }
      ]
    });

    await pergaminoService.publicar(sala1.pergaminoId);

    console.log(`\n📜 Pergamino de la Sala 1 publicado`);
    console.log(`   Prueba pública: GET /api/pergamino/${sala1.qr.code}`);
    console.log(`\n⚠️  Las rutas están abiertas: la autenticación aún no está definida.\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

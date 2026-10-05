// ===================================
// docker/mongo-init.js
// Se ejecuta una sola vez, al crear el volumen de datos.
// Crea el usuario de aplicación con permisos solo sobre su base.
// ===================================
const db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'lazos_pergamino');

db.createUser({
  user: 'lazos',
  pwd: 'lazospass',
  roles: [
    { role: 'readWrite', db: process.env.MONGO_INITDB_DATABASE || 'lazos_pergamino' },
    // dbAdmin permite crear/eliminar índices y colecciones desde la app y los scripts
    { role: 'dbAdmin', db: process.env.MONGO_INITDB_DATABASE || 'lazos_pergamino' }
  ]
});

// Colecciones base del dominio
['usuariofunerarias', 'funerarias', 'salas', 'qrs', 'pergaminos', 'condolencias', 'media'].forEach(nombre => {
  db.createCollection(nombre);
});

print('✅ Base lazos_pergamino inicializada');

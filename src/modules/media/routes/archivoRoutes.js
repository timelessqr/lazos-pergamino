// ===================================
// src/modules/media/routes/archivoRoutes.js
// ===================================
// GET /api/archivo?url=<url pública de R2>
//
// El PDF del pergamino se arma en el navegador dibujando la página en un
// canvas. El bucket de R2 no manda cabeceras CORS, y una imagen sin CORS
// "ensucia" el canvas y el PDF no se puede generar. Esta ruta re-sirve esas
// mismas imágenes desde este backend, que sí tiene CORS para el panel.
//
// Solo sirve archivos de nuestro propio bucket (R2_PUBLIC_URL): no es un proxy
// abierto. Es pública porque <img> no manda token, y los archivos ya son
// públicos en R2.
const express = require('express');
const { environment } = require('../../../config/environment');
const { publicLimiter } = require('../../../middleware/rateLimiter');

const router = express.Router();

router.get('/', publicLimiter, async (req, res) => {
  const base = (environment.r2.publicUrl || '').replace(/\/+$/, '');
  const url = String(req.query.url || '');

  let destino;
  try {
    destino = new URL(url);
  } catch {
    return res.status(400).json({ success: false, message: 'URL inválida' });
  }

  // Mismo origen y ruta bajo el bucket, sin trucos de "..": se compara la URL ya normalizada
  if (!base || !destino.href.startsWith(`${base}/`) || destino.protocol !== 'https:') {
    return res.status(400).json({ success: false, message: 'Solo se sirven archivos del almacenamiento propio' });
  }

  try {
    const respuesta = await fetch(destino.href, { redirect: 'error' });
    if (!respuesta.ok) {
      return res.status(respuesta.status === 404 ? 404 : 502).json({ success: false, message: 'No se pudo obtener el archivo' });
    }

    const tipo = respuesta.headers.get('content-type') || 'application/octet-stream';
    if (!tipo.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Solo se sirven imágenes' });
    }

    res.set('Content-Type', tipo);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await respuesta.arrayBuffer()));
  } catch (error) {
    console.error('Error re-sirviendo archivo:', error.message);
    res.status(502).json({ success: false, message: 'No se pudo obtener el archivo' });
  }
});

module.exports = router;

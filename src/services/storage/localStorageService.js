// ===================================
// src/services/storage/localStorageService.js
// ===================================
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { environment } = require('../../config/environment');

class LocalStorageService {
  constructor() {
    this.driver = 'local';
    this.baseDir = path.resolve(process.cwd(), environment.uploadDir);
  }

  /**
   * Guarda un buffer en disco y devuelve sus metadatos
   */
  async upload(buffer, options = {}) {
    const { folder = 'general', originalName = 'archivo', mimeType } = options;

    const extension = path.extname(originalName).replace('.', '').toLowerCase() || 'bin';
    const nombreAlmacenado = `${uuidv4()}.${extension}`;
    const carpeta = path.join(this.baseDir, folder);

    await fs.mkdir(carpeta, { recursive: true });

    const rutaAbsoluta = path.join(carpeta, nombreAlmacenado);
    await fs.writeFile(rutaAbsoluta, buffer);

    const rutaRelativa = path.posix.join(environment.uploadDir, folder, nombreAlmacenado);

    return {
      driver: this.driver,
      nombreOriginal: originalName,
      nombreAlmacenado,
      ruta: rutaRelativa,
      url: `/${rutaRelativa}`,
      mimeType,
      extension,
      tamano: buffer.length
    };
  }

  /**
   * Elimina un archivo del disco
   */
  async delete(rutaRelativa) {
    try {
      const rutaAbsoluta = path.resolve(process.cwd(), rutaRelativa);
      await fs.unlink(rutaAbsoluta);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }

  /**
   * La URL local ya es publica al servirse via express.static
   */
  async getSignedUrl(rutaRelativa) {
    return `/${rutaRelativa}`;
  }

  /**
   * Informacion del driver
   */
  getInfo() {
    return { driver: this.driver, baseDir: this.baseDir, publico: true };
  }
}

module.exports = { localStorageService: new LocalStorageService() };

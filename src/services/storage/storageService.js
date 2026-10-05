// ===================================
// src/services/storage/storageService.js
// ===================================
const { environment } = require('../../config/environment');
const { localStorageService } = require('./localStorageService');
const { r2StorageService } = require('./r2StorageService');

class StorageService {
  /**
   * Devuelve el driver activo segun STORAGE_DRIVER
   */
  getDriver() {
    return environment.storageDriver === 'r2' ? r2StorageService : localStorageService;
  }

  /**
   * Sube un archivo con el driver activo
   */
  async upload(buffer, options = {}) {
    return await this.getDriver().upload(buffer, options);
  }

  /**
   * Elimina un archivo con el driver activo
   */
  async delete(ruta) {
    return await this.getDriver().delete(ruta);
  }

  /**
   * Obtiene URL accesible del archivo
   */
  async getSignedUrl(ruta, expiresIn = 3600) {
    return await this.getDriver().getSignedUrl(ruta, expiresIn);
  }

  /**
   * Informacion del almacenamiento en uso
   */
  getInfo() {
    return this.getDriver().getInfo();
  }
}

module.exports = { storageService: new StorageService() };

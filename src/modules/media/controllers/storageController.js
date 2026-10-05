// ===================================
// src/modules/media/controllers/storageController.js
// ===================================
const mediaService = require('../services/mediaService');
const { responseHelper } = require('../../../utils/responseHelper');

class StorageController {
  /**
   * GET /api/media/storage/info
   */
  async getInfo(req, res) {
    try {
      const info = mediaService.getStorageInfo();
      responseHelper.success(res, info, 'Información de almacenamiento obtenida');
    } catch (error) {
      console.error('Error obteniendo información de storage:', error);
      responseHelper.error(res, error.message, 400);
    }
  }
}

module.exports = new StorageController();

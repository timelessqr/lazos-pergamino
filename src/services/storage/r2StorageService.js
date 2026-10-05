// ===================================
// src/services/storage/r2StorageService.js
// ===================================
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { environment } = require('../../config/environment');

class R2StorageService {
  constructor() {
    this.driver = 'r2';
    this.bucket = environment.r2.bucketName;
    this.publicUrl = environment.r2.publicUrl;
    this.client = null;
  }

  /**
   * Cliente S3 apuntando a Cloudflare R2 (lazy)
   */
  getClient() {
    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${environment.r2.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: environment.r2.accessKeyId,
          secretAccessKey: environment.r2.secretAccessKey
        }
      });
    }

    return this.client;
  }

  /**
   * Sube un buffer a R2 y devuelve sus metadatos
   */
  async upload(buffer, options = {}) {
    const { folder = 'general', originalName = 'archivo', mimeType } = options;

    const extension = path.extname(originalName).replace('.', '').toLowerCase() || 'bin';
    const nombreAlmacenado = `${uuidv4()}.${extension}`;
    const key = `${folder}/${nombreAlmacenado}`;

    await this.getClient().send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType
    }));

    return {
      driver: this.driver,
      nombreOriginal: originalName,
      nombreAlmacenado,
      ruta: key,
      url: this.publicUrl ? `${this.publicUrl}/${key}` : key,
      mimeType,
      extension,
      tamano: buffer.length
    };
  }

  /**
   * Elimina un objeto de R2
   */
  async delete(key) {
    await this.getClient().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    return true;
  }

  /**
   * URL firmada temporal (para buckets no publicos)
   */
  async getSignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return await getSignedUrl(this.getClient(), command, { expiresIn });
  }

  /**
   * Informacion del driver
   */
  getInfo() {
    return { driver: this.driver, bucket: this.bucket, publico: Boolean(this.publicUrl) };
  }
}

module.exports = { r2StorageService: new R2StorageService() };

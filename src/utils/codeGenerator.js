// ===================================
// src/utils/codeGenerator.js
// ===================================
const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (0,O,1,I)

class CodeGenerator {
  /**
   * Genera un codigo alfanumerico aleatorio para el QR de una sala
   */
  generateQRCode(length = 10) {
    const bytes = crypto.randomBytes(length);
    let code = '';

    for (let i = 0; i < length; i++) {
      code += ALPHABET[bytes[i] % ALPHABET.length];
    }

    return code;
  }

  /**
   * Genera un codigo numerico de acceso para el libro de condolencias
   */
  generateAccessCode(length = 6) {
    const bytes = crypto.randomBytes(length);
    let code = '';

    for (let i = 0; i < length; i++) {
      code += String(bytes[i] % 10);
    }

    return code;
  }

  /**
   * Genera el siguiente codigo secuencial de funeraria (FUN-001, FUN-002, ...)
   */
  async generateSequentialCode(model, prefix, padding = 3) {
    const regex = new RegExp(`^${prefix}-\\d+$`);

    const existing = await model
      .find({ codigo: { $regex: regex } }, { codigo: 1 })
      .lean();

    const numbers = existing.map(doc => {
      const match = doc.codigo.match(new RegExp(`^${prefix}-(\\d+)$`));
      return match ? parseInt(match[1]) : 0;
    });

    const nextNumber = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;

    return `${prefix}-${String(nextNumber).padStart(padding, '0')}`;
  }
}

module.exports = { codeGenerator: new CodeGenerator() };

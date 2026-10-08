// ===================================
// src/modules/cuentas/repositories/cuentaRepository.js
// ===================================
const mongoose = require('mongoose');
const CuentaFuneraria = require('../../../models/CuentaFuneraria');

class CuentaRepository {
  /**
   * Crear cuenta de funeraria
   */
  async create(cuentaData) {
    try {
      const cuenta = new CuentaFuneraria(cuentaData);
      return await cuenta.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Ya existe una cuenta con ese email');
      }
      throw error;
    }
  }

  /**
   * Obtener cuenta por ID (sin la contraseña)
   */
  async findById(cuentaId) {
    if (!mongoose.isValidObjectId(cuentaId)) {
      throw new Error('ID de cuenta inválido');
    }

    const cuenta = await CuentaFuneraria.findById(cuentaId);
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    return cuenta;
  }

  /**
   * Obtener cuenta por ID con la contraseña (para verificarla o cambiarla)
   */
  async findByIdConPassword(cuentaId) {
    const cuenta = await CuentaFuneraria.findById(cuentaId).select('+passwordHash');
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    return cuenta;
  }

  /**
   * Buscar por email con la contraseña (login). Devuelve null si no existe.
   */
  async findByEmailConPassword(email) {
    return await CuentaFuneraria.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
  }

  /**
   * Cuentas de una funeraria
   */
  async findByFuneraria(funerariaId) {
    return await CuentaFuneraria.find({ funerariaId }).sort({ createdAt: 1 });
  }

  /**
   * Registrar el último acceso sin bloquear la petición
   */
  registrarAcceso(cuentaId) {
    CuentaFuneraria.updateOne({ _id: cuentaId }, { ultimoAcceso: new Date() })
      .catch(err => console.error('No se pudo registrar el último acceso:', err.message));
  }

  /**
   * Eliminar una cuenta
   */
  async delete(cuentaId) {
    const cuenta = await CuentaFuneraria.findByIdAndDelete(cuentaId);
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    return cuenta;
  }

  /**
   * Eliminar las cuentas de una funeraria
   */
  async deleteByFuneraria(funerariaId) {
    return await CuentaFuneraria.deleteMany({ funerariaId });
  }
}

module.exports = new CuentaRepository();

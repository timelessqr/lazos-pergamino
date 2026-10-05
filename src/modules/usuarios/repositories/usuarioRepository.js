// ===================================
// src/modules/usuarios/repositories/usuarioRepository.js
// ===================================
const mongoose = require('mongoose');
const UsuarioFuneraria = require('../../../models/UsuarioFuneraria');

class UsuarioRepository {
  /**
   * Registrar el mapeo de un usuario de core-qr en esta plataforma
   */
  async create(usuarioData) {
    try {
      const usuario = new UsuarioFuneraria(usuarioData);
      return await usuario.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Ese usuario de core-qr ya está registrado en la plataforma');
      }
      throw error;
    }
  }

  /**
   * Buscar por el userId que emite core-qr
   */
  async findByCoreUserId(coreUserId) {
    return await UsuarioFuneraria.findOne({ coreUserId: String(coreUserId) });
  }

  /**
   * Buscar por ID local
   */
  async findById(usuarioId) {
    if (!mongoose.isValidObjectId(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    const usuario = await UsuarioFuneraria.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Listar los usuarios de una funeraria
   */
  async findByFuneraria(funerariaId) {
    return await UsuarioFuneraria.find({ funerariaId, isActive: true }).lean();
  }

  /**
   * Listar todos los usuarios registrados
   */
  async findAll(options = {}) {
    const { rol, soloActivos = true } = options;

    const query = {};
    if (rol) query.rol = rol;
    if (soloActivos) query.isActive = true;

    return await UsuarioFuneraria.find(query)
      .populate('funerariaId', 'codigo nombre')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Actualizar el rol o la funeraria de un usuario
   */
  async update(usuarioId, updateData) {
    const usuario = await UsuarioFuneraria.findByIdAndUpdate(usuarioId, updateData, {
      new: true,
      runValidators: true
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Revocar el acceso de un usuario a la plataforma
   */
  async deactivate(usuarioId) {
    return await this.update(usuarioId, { isActive: false });
  }

  /**
   * Eliminar el mapeo (no borra nada en core-qr)
   */
  async delete(usuarioId) {
    const usuario = await UsuarioFuneraria.findByIdAndDelete(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Eliminar los usuarios de una funeraria
   */
  async deleteByFuneraria(funerariaId) {
    return await UsuarioFuneraria.deleteMany({ funerariaId });
  }
}

module.exports = new UsuarioRepository();

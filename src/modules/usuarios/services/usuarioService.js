// ===================================
// src/modules/usuarios/services/usuarioService.js
//
// Gestiona QUIÉN de core-qr tiene acceso a esta plataforma y con qué rol.
// No hay login ni contraseñas aquí: de eso se encarga core-qr.
// ===================================
const usuarioRepository = require('../repositories/usuarioRepository');
const { ROLES } = require('../../../utils/constants');

class UsuarioService {
  /**
   * Dar acceso a un usuario de core-qr, asignándole rol y funeraria
   */
  async registrarAcceso(usuarioData) {
    try {
      if (!usuarioData.coreUserId) {
        throw new Error('El coreUserId (userId de core-qr) es requerido');
      }

      const existente = await usuarioRepository.findByCoreUserId(usuarioData.coreUserId);
      if (existente) {
        throw new Error('Ese usuario de core-qr ya tiene acceso a la plataforma');
      }

      const rol = usuarioData.rol || ROLES.FUNERARIA;

      if (rol === ROLES.FUNERARIA && !usuarioData.funerariaId) {
        throw new Error('Un usuario de rol funeraria debe tener una funeraria asignada');
      }

      const usuario = await usuarioRepository.create({
        coreUserId: String(usuarioData.coreUserId),
        nombre: usuarioData.nombre,
        email: usuarioData.email,
        rol,
        funerariaId: rol === ROLES.SUPERADMIN ? null : usuarioData.funerariaId
      });

      return {
        usuario: this.formatUsuario(usuario),
        message: 'Acceso concedido exitosamente'
      };
    } catch (error) {
      throw new Error(`Error registrando acceso: ${error.message}`);
    }
  }

  /**
   * Perfil del usuario autenticado (lo resolvió el middleware desde el token)
   */
  async getPerfil(usuarioId) {
    try {
      const usuario = await usuarioRepository.findById(usuarioId);
      return this.formatUsuario(usuario);
    } catch (error) {
      throw new Error(`Error obteniendo perfil: ${error.message}`);
    }
  }

  /**
   * Listar los usuarios con acceso
   */
  async getUsuarios(options = {}) {
    try {
      const usuarios = await usuarioRepository.findAll(options);
      return usuarios.map(usuario => this.formatUsuario(usuario));
    } catch (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }
  }

  /**
   * Listar los usuarios de una funeraria
   */
  async getUsuariosByFuneraria(funerariaId) {
    try {
      const usuarios = await usuarioRepository.findByFuneraria(funerariaId);
      return usuarios.map(usuario => this.formatUsuario(usuario));
    } catch (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }
  }

  /**
   * Cambiar el rol o la funeraria de un usuario
   */
  async actualizarUsuario(usuarioId, updateData) {
    try {
      const permitidos = ['nombre', 'email', 'rol', 'funerariaId', 'isActive'];
      const cambios = {};

      permitidos.forEach(campo => {
        if (updateData[campo] !== undefined) cambios[campo] = updateData[campo];
      });

      if (cambios.rol === ROLES.SUPERADMIN) {
        cambios.funerariaId = null;
      }

      const usuario = await usuarioRepository.update(usuarioId, cambios);

      return {
        usuario: this.formatUsuario(usuario),
        message: 'Usuario actualizado exitosamente'
      };
    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }

  /**
   * Revocar el acceso de un usuario (no lo borra en core-qr)
   */
  async revocarAcceso(usuarioId) {
    try {
      await usuarioRepository.deactivate(usuarioId);
      return { message: 'Acceso revocado exitosamente' };
    } catch (error) {
      throw new Error(`Error revocando acceso: ${error.message}`);
    }
  }

  /**
   * Formatea el usuario para exponerlo por la API
   */
  formatUsuario(usuario) {
    return {
      id: usuario._id,
      coreUserId: usuario.coreUserId,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      funeraria: usuario.funerariaId && usuario.funerariaId.nombre
        ? { id: usuario.funerariaId._id, codigo: usuario.funerariaId.codigo, nombre: usuario.funerariaId.nombre }
        : usuario.funerariaId,
      isActive: usuario.isActive,
      ultimoAcceso: usuario.ultimoAcceso
    };
  }
}

module.exports = new UsuarioService();

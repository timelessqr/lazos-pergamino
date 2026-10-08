// ===================================
// src/modules/cuentas/services/cuentaService.js
// Login y gestión de las cuentas de funeraria
// ===================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cuentaRepository = require('../repositories/cuentaRepository');
const funerariaRepository = require('../../funerarias/repositories/funerariaRepository');
const { SECURITY } = require('../../../utils/constants');

// Hash de una contraseña cualquiera: si el email no existe se compara igual
// contra este, para que el tiempo de respuesta no delate qué emails existen
const HASH_FALSO = bcrypt.hashSync('no-existe-esta-cuenta', 10);

const CREDENCIALES_INVALIDAS = 'Email o contraseña incorrectos';

class CuentaService {
  /**
   * Firma el token de una cuenta de funeraria. Lleva tipo 'funeraria' y la
   * versión de la contraseña: si la contraseña cambia, los tokens viejos caen.
   */
  firmarToken(cuenta) {
    if (!SECURITY.FUNERARIA_JWT_SECRET) {
      throw new Error('El login de funerarias no está configurado');
    }

    return jwt.sign(
      { sub: String(cuenta._id), tipo: 'funeraria', v: cuenta.versionToken },
      SECURITY.FUNERARIA_JWT_SECRET,
      { expiresIn: SECURITY.JWT_EXPIRES_IN }
    );
  }

  /**
   * PUBLICO: login con email y contraseña
   */
  async login(email, password) {
    const cuenta = await cuentaRepository.findByEmailConPassword(email);
    const valida = await bcrypt.compare(String(password), cuenta?.passwordHash || HASH_FALSO);

    if (!cuenta || !valida || !cuenta.isActive) {
      throw new Error(CREDENCIALES_INVALIDAS);
    }

    const funeraria = await funerariaRepository.findById(cuenta.funerariaId);
    if (funeraria.activo === false) {
      throw new Error('La funeraria está desactivada');
    }

    cuentaRepository.registrarAcceso(cuenta._id);

    return {
      token: this.firmarToken(cuenta),
      cuenta: this.formatCuenta(cuenta),
      funeraria: this.formatFuneraria(funeraria)
    };
  }

  /**
   * Datos de quien está logueado (cuenta de funeraria o superadmin)
   */
  async perfil(user) {
    if (user.tipo !== 'cuenta') {
      return { rol: user.rol, nombre: user.nombre, email: user.email };
    }

    const [cuenta, funeraria] = await Promise.all([
      cuentaRepository.findById(user.id),
      funerariaRepository.findById(user.funerariaId)
    ]);

    return {
      rol: user.rol,
      cuenta: this.formatCuenta(cuenta),
      funeraria: this.formatFuneraria(funeraria)
    };
  }

  /**
   * La cuenta cambia su propia contraseña. Devuelve un token nuevo porque
   * el cambio invalida los anteriores.
   */
  async cambiarPassword(cuentaId, actual, nueva) {
    const cuenta = await cuentaRepository.findByIdConPassword(cuentaId);

    if (!(await bcrypt.compare(String(actual), cuenta.passwordHash))) {
      throw new Error('La contraseña actual no es correcta');
    }

    cuenta.passwordHash = await bcrypt.hash(String(nueva), SECURITY.BCRYPT_ROUNDS);
    cuenta.versionToken += 1;
    await cuenta.save();

    return { token: this.firmarToken(cuenta), message: 'Contraseña actualizada' };
  }

  // ============ ADMIN (superadmin) ============

  async listar(funerariaId) {
    await funerariaRepository.findById(funerariaId);
    const cuentas = await cuentaRepository.findByFuneraria(funerariaId);
    return cuentas.map(cuenta => this.formatCuenta(cuenta));
  }

  async crear(funerariaId, { nombre, email, password }) {
    await funerariaRepository.findById(funerariaId);

    const cuenta = await cuentaRepository.create({
      funerariaId,
      nombre,
      email,
      passwordHash: await bcrypt.hash(String(password), SECURITY.BCRYPT_ROUNDS)
    });

    return { cuenta: this.formatCuenta(cuenta), message: 'Cuenta creada' };
  }

  /**
   * Cambiar nombre o activar/desactivar. Desactivar corta las sesiones abiertas.
   */
  async actualizar(cuentaId, { nombre, isActive }) {
    const cuenta = await cuentaRepository.findById(cuentaId);

    if (nombre !== undefined) cuenta.nombre = nombre;
    if (isActive !== undefined && isActive !== cuenta.isActive) {
      cuenta.isActive = isActive;
      if (!isActive) cuenta.versionToken += 1;
    }

    await cuenta.save();
    return { cuenta: this.formatCuenta(cuenta), message: 'Cuenta actualizada' };
  }

  /**
   * El superadmin pone una contraseña nueva (olvido). Corta las sesiones abiertas.
   */
  async restablecerPassword(cuentaId, password) {
    const cuenta = await cuentaRepository.findByIdConPassword(cuentaId);

    cuenta.passwordHash = await bcrypt.hash(String(password), SECURITY.BCRYPT_ROUNDS);
    cuenta.versionToken += 1;
    await cuenta.save();

    return { message: 'Contraseña restablecida' };
  }

  formatCuenta(cuenta) {
    return {
      id: cuenta._id,
      funerariaId: cuenta.funerariaId,
      nombre: cuenta.nombre,
      email: cuenta.email,
      isActive: cuenta.isActive,
      ultimoAcceso: cuenta.ultimoAcceso,
      createdAt: cuenta.createdAt
    };
  }

  formatFuneraria(funeraria) {
    return {
      id: funeraria._id,
      codigo: funeraria.codigo,
      nombre: funeraria.nombre,
      logoUrl: funeraria.branding?.logoUrl
    };
  }
}

module.exports = new CuentaService();

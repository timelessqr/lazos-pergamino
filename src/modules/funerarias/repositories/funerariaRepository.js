// ===================================
// src/modules/funerarias/repositories/funerariaRepository.js
// ===================================
const mongoose = require('mongoose');
const Funeraria = require('../../../models/Funeraria');

class FunerariaRepository {
  /**
   * Crear funeraria
   */
  async create(funerariaData) {
    try {
      const funeraria = new Funeraria(funerariaData);
      return await funeraria.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`Ya existe una funeraria con ese ${field}`);
      }
      throw error;
    }
  }

  /**
   * Obtener funeraria por ID
   */
  async findById(funerariaId) {
    if (!mongoose.isValidObjectId(funerariaId)) {
      throw new Error('ID de funeraria inválido');
    }

    const funeraria = await Funeraria.findById(funerariaId);
    if (!funeraria) {
      throw new Error('Funeraria no encontrada');
    }

    return funeraria;
  }

  /**
   * Obtener funeraria con sus salas pobladas
   */
  async findByIdWithSalas(funerariaId) {
    if (!mongoose.isValidObjectId(funerariaId)) {
      throw new Error('ID de funeraria inválido');
    }

    const funeraria = await Funeraria.findById(funerariaId).populate({
      path: 'salas',
      options: { sort: { numero: 1 } },
      populate: [
        { path: 'qrId', select: 'code url imagenUrl isActive estadisticas' },
        { path: 'pergaminoId', select: 'estado template difunto version ultimaEdicion' }
      ]
    });

    if (!funeraria) {
      throw new Error('Funeraria no encontrada');
    }

    return funeraria;
  }

  /**
   * Obtener funeraria por codigo (FUN-001)
   */
  async findByCode(codigo) {
    const funeraria = await Funeraria.findOne({
      codigo: String(codigo).toUpperCase().trim(),
      activo: true
    });

    if (!funeraria) {
      throw new Error('Funeraria no encontrada');
    }

    return funeraria;
  }

  /**
   * Listar funerarias con paginacion y busqueda
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'fechaRegistro',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = { activo: true };

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { nombre: regex },
        { codigo: regex },
        { ruc: regex },
        { telefono: regex },
        { email: regex },
        { ciudad: regex }
      ];
    }

    const [funerarias, total] = await Promise.all([
      Funeraria.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Funeraria.countDocuments(query)
    ]);

    return {
      funerarias,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Actualizar funeraria
   */
  async update(funerariaId, updateData) {
    if (!mongoose.isValidObjectId(funerariaId)) {
      throw new Error('ID de funeraria inválido');
    }

    const funeraria = await Funeraria.findByIdAndUpdate(
      funerariaId,
      { ...updateData, ultimaActualizacion: new Date() },
      { new: true, runValidators: true }
    );

    if (!funeraria) {
      throw new Error('Funeraria no encontrada');
    }

    return funeraria;
  }

  /**
   * Actualizar campos sueltos con $set (rutas con punto, ej. 'branding.logoUrl'):
   * a diferencia de update(), no reemplaza el subdocumento entero
   */
  async setCampos(funerariaId, set) {
    if (!mongoose.isValidObjectId(funerariaId)) {
      throw new Error('ID de funeraria inválido');
    }

    const funeraria = await Funeraria.findByIdAndUpdate(
      funerariaId,
      { $set: { ...set, ultimaActualizacion: new Date() } },
      { new: true, runValidators: true }
    );

    if (!funeraria) {
      throw new Error('Funeraria no encontrada');
    }

    return funeraria;
  }

  /**
   * Desactivar funeraria (soft delete)
   */
  async softDelete(funerariaId) {
    return await this.update(funerariaId, { activo: false });
  }

  /**
   * Buscar funerarias por termino
   */
  async search(termino, limit = 10) {
    return await Funeraria.buscar(termino).limit(limit).lean();
  }

  /**
   * Estadisticas generales de funerarias
   */
  async getStats() {
    const [total, activas, ultimoMes] = await Promise.all([
      Funeraria.countDocuments({}),
      Funeraria.countDocuments({ activo: true }),
      Funeraria.countDocuments({
        activo: true,
        fechaRegistro: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    return { total, activas, inactivas: total - activas, nuevasUltimoMes: ultimoMes };
  }

  /**
   * Comprobar existencia por RUC
   */
  async existsByRuc(ruc) {
    if (!ruc) return false;
    const count = await Funeraria.countDocuments({ ruc: String(ruc).toUpperCase().trim() });
    return count > 0;
  }
}

module.exports = new FunerariaRepository();

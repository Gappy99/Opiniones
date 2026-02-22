import Opinion from './opinion.model.js';

// Crear opinión
export const createOpinion = async (req, res) => {
  try {
    // Datos requeridos para crear opinión
    const { title, category, content } = req.body;
    // userId y user vienen del middleware de autenticación
    const { userId, user } = req;

    // Se guarda el nombre del autor para mostrarlo sin hacer más consultas
    const opinion = new Opinion({
      title,
      category,
      content,
      authorId: userId,
      authorName: `${user.Name} ${user.Surname}`,
    });

    await opinion.save();

    res.status(201).json({
      success: true,
      message: 'Opinión creada exitosamente',
      data: opinion,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear opinión',
      error: error.message,
    });
  }
};

// Obtener todas las opiniones (con paginación y filtros)
export const getOpinions = async (req, res) => {
  try {
    // page y limit vienen como string desde query; convertir a enteros
    const { category, authorId } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Solo se muestran opiniones activas (soft delete)
    const filter = { isActive: true };

    // Filtro opcional por categoría
    if (category) {
      filter.category = category;
    }

    // Filtro opcional por autor
    if (authorId) {
      filter.authorId = authorId;
    }

    const opinions = await Opinion.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Opinion.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: opinions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener opiniones',
      error: error.message,
    });
  }
};

// Obtener opinión por ID
export const getOpinionById = async (req, res) => {
  try {
    const { id } = req.params;

    const opinion = await Opinion.findById(id);

    if (!opinion) {
      return res.status(404).json({
        success: false,
        message: 'Opinión no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      data: opinion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener opinión',
      error: error.message,
    });
  }
};

// Actualizar opinión (solo el autor)
export const updateOpinion = async (req, res) => {
  try {
    const { id } = req.params;
    // userId viene del token
    const { userId } = req;
    const { title, category, content } = req.body;

    const opinion = await Opinion.findById(id);

    if (!opinion) {
      return res.status(404).json({
        success: false,
        message: 'Opinión no encontrada',
      });
    }

    // Verificar que el usuario sea el autor
    if (String(opinion.authorId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta opinión',
      });
    }

    // Actualizar solo los campos enviados
    if (title !== undefined) opinion.title = title;
    if (category !== undefined) opinion.category = category;
    if (content !== undefined) opinion.content = content;

    await opinion.save();

    res.status(200).json({
      success: true,
      message: 'Opinión actualizada exitosamente',
      data: opinion,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar opinión',
      error: error.message,
    });
  }
};

// Eliminar opinión (solo el autor) - soft delete
export const deleteOpinion = async (req, res) => {
  try {
    const { id } = req.params;
    // userId viene del token
    const { userId } = req;

    const opinion = await Opinion.findById(id);

    if (!opinion) {
      return res.status(404).json({
        success: false,
        message: 'Opinión no encontrada',
      });
    }

    // Verificar que el usuario sea el autor
    if (String(opinion.authorId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta opinión',
      });
    }

    // Soft delete: se marca inactiva para no perder historial
    opinion.isActive = false;
    await opinion.save();

    res.status(200).json({
      success: true,
      message: 'Opinión eliminada exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar opinión',
      error: error.message,
    });
  }
};

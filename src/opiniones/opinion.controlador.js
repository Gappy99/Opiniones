import Opinion from '../opinions/opinion.model.js';

export const createOpinion = async (req, res) => {
  try {
    const { title, category, content } = req.body;
    const { userId, user } = req;

    const opinion = new Opinion({
      title,
      category,
      content,
      authorId: userId,
      authorName: `${user.Name} ${user.Surname}`,
    });

    await opinion.save();

    return res.status(201).json({ exito: true, mensaje: 'Opinión creada exitosamente', data: opinion });
  } catch (error) {
    return res.status(400).json({ exito: false, mensaje: 'Error al crear opinión', error: error.message });
  }
};

export const getOpinions = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, authorId } = req.query;
    const filtro = { isActive: true };
    if (category) filtro.category = category;
    if (authorId) filtro.authorId = authorId;

    const opinions = await Opinion.find(filtro)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Opinion.countDocuments(filtro);

    return res.status(200).json({
      exito: true,
      data: opinions,
      paginacion: {
        paginaActual: parseInt(page),
        totalPaginas: Math.ceil(total / limit),
        totalRegistros: total,
        limite: parseInt(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener opiniones', error: error.message });
  }
};

export const getOpinionById = async (req, res) => {
  try {
    const { id } = req.params;
    const opinion = await Opinion.findById(id);
    if (!opinion) return res.status(404).json({ exito: false, mensaje: 'Opinión no encontrada' });
    return res.status(200).json({ exito: true, data: opinion });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener opinión', error: error.message });
  }
};

export const updateOpinion = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;
    const { title, category, content } = req.body;

    const opinion = await Opinion.findById(id);
    if (!opinion) return res.status(404).json({ exito: false, mensaje: 'Opinión no encontrada' });
    if (opinion.authorId !== userId) return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para editar esta opinión' });

    if (title !== undefined) opinion.title = title;
    if (category !== undefined) opinion.category = category;
    if (content !== undefined) opinion.content = content;

    await opinion.save();

    return res.status(200).json({ exito: true, mensaje: 'Opinión actualizada exitosamente', data: opinion });
  } catch (error) {
    return res.status(400).json({ exito: false, mensaje: 'Error al actualizar opinión', error: error.message });
  }
};

export const deleteOpinion = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;

    const opinion = await Opinion.findById(id);
    if (!opinion) return res.status(404).json({ exito: false, mensaje: 'Opinión no encontrada' });
    if (opinion.authorId !== userId) return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para eliminar esta opinión' });

    opinion.isActive = false;
    await opinion.save();

    return res.status(200).json({ exito: true, mensaje: 'Opinión eliminada exitosamente' });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al eliminar opinión', error: error.message });
  }
};

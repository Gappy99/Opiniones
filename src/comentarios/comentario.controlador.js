import Comment from '../comments/comment.model.js';
import Opinion from '../opinions/opinion.model.js';

export const createComment = async (req, res) => {
  try {
    const { opinionId, content } = req.body;
    const { userId, user } = req;

    const opinion = await Opinion.findById(opinionId);
    if (!opinion || !opinion.isActive) return res.status(404).json({ exito: false, mensaje: 'Opinión no encontrada' });

    const comment = new Comment({ opinionId, content, authorId: userId, authorName: `${user.Name} ${user.Surname}` });
    await comment.save();

    return res.status(201).json({ exito: true, mensaje: 'Comentario creado exitosamente', data: comment });
  } catch (error) {
    return res.status(400).json({ exito: false, mensaje: 'Error al crear comentario', error: error.message });
  }
};

export const getCommentsByOpinion = async (req, res) => {
  try {
    const { opinionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const opinion = await Opinion.findById(opinionId);
    if (!opinion) return res.status(404).json({ exito: false, mensaje: 'Opinión no encontrada' });

    const filtro = { opinionId, isActive: true };

    const comments = await Comment.find(filtro)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments(filtro);

    return res.status(200).json({ exito: true, data: comments, paginacion: { paginaActual: parseInt(page), totalPaginas: Math.ceil(total / limit), totalRegistros: total, limite: parseInt(limit) } });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener comentarios', error: error.message });
  }
};

export const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ exito: false, mensaje: 'Comentario no encontrado' });
    return res.status(200).json({ exito: true, data: comment });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al obtener comentario', error: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;
    const { content } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ exito: false, mensaje: 'Comentario no encontrado' });
    if (comment.authorId !== userId) return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para editar este comentario' });

    if (content !== undefined) comment.content = content;
    await comment.save();

    return res.status(200).json({ exito: true, mensaje: 'Comentario actualizado exitosamente', data: comment });
  } catch (error) {
    return res.status(400).json({ exito: false, mensaje: 'Error al actualizar comentario', error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ exito: false, mensaje: 'Comentario no encontrado' });
    if (comment.authorId !== userId) return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para eliminar este comentario' });

    comment.isActive = false;
    await comment.save();

    return res.status(200).json({ exito: true, mensaje: 'Comentario eliminado exitosamente' });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error al eliminar comentario', error: error.message });
  }
};

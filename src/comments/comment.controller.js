import Comment from './comment.model.js';
import Opinion from '../opinions/opinion.model.js';

// Crear comentario
export const createComment = async (req, res) => {
  try {
    // Datos requeridos para comentar
    const { opinionId, content } = req.body;
    // userId y user vienen del middleware de autenticación
    const { userId, user } = req;

    // Verificar que la opinión existe
    const opinion = await Opinion.findById(opinionId);
    if (!opinion || !opinion.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Opinión no encontrada',
      });
    }

    // Se guarda el nombre del autor para mostrarlo sin consultas adicionales
    const comment = new Comment({
      opinionId,
      content,
      authorId: userId,
      authorName: `${user.Name} ${user.Surname}`,
    });

    await comment.save();

    res.status(201).json({
      success: true,
      message: 'Comentario creado exitosamente',
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear comentario',
      error: error.message,
    });
  }
};

// Obtener comentarios de una opinión
export const getCommentsByOpinion = async (req, res) => {
  try {
    const { opinionId } = req.params;
    // page y limit llegan como string desde query -> parsear a enteros
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    // Verificar que la opinión existe
    const opinion = await Opinion.findById(opinionId);
    if (!opinion) {
      return res.status(404).json({
        success: false,
        message: 'Opinión no encontrada',
      });
    }

    // Solo comentarios activos (soft delete)
    const filter = { opinionId, isActive: true };

    const comments = await Comment.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: comments,
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
      message: 'Error al obtener comentarios',
      error: error.message,
    });
  }
};

// Obtener comentario por ID
export const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentario',
      error: error.message,
    });
  }
};

// Actualizar comentario (solo el autor)
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    // userId viene del token
    const { userId } = req;
    const { content } = req.body;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado',
      });
    }

    // Verificar que el usuario sea el autor
    if (String(comment.authorId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este comentario',
      });
    }

    // Solo actualiza si viene el campo content
    if (content !== undefined) {
      comment.content = content;
    }

    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comentario actualizado exitosamente',
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar comentario',
      error: error.message,
    });
  }
};

// Eliminar comentario (solo el autor) - soft delete
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    // userId viene del token
    const { userId } = req;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado',
      });
    }

    // Verificar que el usuario sea el autor
    if (String(comment.authorId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este comentario',
      });
    }

    // Soft delete: se marca inactivo y no se elimina físicamente
    comment.isActive = false;
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comentario eliminado exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar comentario',
      error: error.message,
    });
  }
};

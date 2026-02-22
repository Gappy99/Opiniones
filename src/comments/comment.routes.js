import { Router } from 'express';
import {
  createComment,
  getCommentsByOpinion,
  getCommentById,
  updateComment,
  deleteComment,
} from './comment.controller.js';
import { validateJWT } from '../../middlewares/validar-JWT.js';
import {
  validateCreateComment,
  validateUpdateComment,
  validateCommentId,
  validateGetCommentsByOpinion,
} from '../../middlewares/validacion-comentario.js';
import { handleValidationErrors } from '../../middlewares/validacion.js';

const router = Router();

/**
 * POST /
 * Crear un nuevo comentario
 * Requiere autenticación
 */
router.post(
  '/',
  validateJWT,
  validateCreateComment,
  handleValidationErrors,
  createComment
);

/**
 * GET /opinion/:opinionId
 * Obtener todos los comentarios de una opinión
 * Soporta paginación
 */
router.get(
  '/opinion/:opinionId',
  validateGetCommentsByOpinion,
  handleValidationErrors,
  getCommentsByOpinion
);

/**
 * GET /:id
 * Obtener un comentario por ID
 */
router.get('/:id', validateCommentId, handleValidationErrors, getCommentById);

/**
 * PUT /:id
 * Actualizar un comentario
 * Solo el autor puede editar
 */
router.put(
  '/:id',
  validateJWT,
  validateUpdateComment,
  handleValidationErrors,
  updateComment
);

/**
 * DELETE /:id
 * Eliminar un comentario (soft delete)
 * Solo el autor puede eliminar
 */
router.delete('/:id', validateJWT, validateCommentId, handleValidationErrors, deleteComment);

export default router;

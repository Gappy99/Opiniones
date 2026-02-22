import { Router } from 'express';
import {
  createComment,
  getCommentsByOpinion,
  getCommentById,
  updateComment,
  deleteComment,
} from './comentario.controlador.js';
import { validateJWT } from '../../middlewares/validar-JWT.js';
import {
  validateCreateComment,
  validateUpdateComment,
  validateCommentId,
  validateGetCommentsByOpinion,
} from '../../middlewares/validacion-comentario.js';
import { handleValidationErrors } from '../../middlewares/validacion.js';

const router = Router();

// Rutas de comentarios (contenido y paths iguales a las originales)
router.post(
  '/',
  validateJWT,
  validateCreateComment,
  handleValidationErrors,
  createComment
);

router.get(
  '/opinion/:opinionId',
  validateGetCommentsByOpinion,
  handleValidationErrors,
  getCommentsByOpinion
);

router.get('/:id', validateCommentId, handleValidationErrors, getCommentById);

router.put(
  '/:id',
  validateJWT,
  validateUpdateComment,
  handleValidationErrors,
  updateComment
);

router.delete('/:id', validateJWT, validateCommentId, handleValidationErrors, deleteComment);

export default router;

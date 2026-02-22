import { Router } from 'express';
import {
  createOpinion,
  getOpinions,
  getOpinionById,
  updateOpinion,
  deleteOpinion,
} from './opinion.controlador.js';
import { validateJWT } from '../../middlewares/validar-JWT.js';
import {
  validateCreateOpinion,
  validateUpdateOpinion,
  validateOpinionId,
  validateOpinionQuery,
} from '../../middlewares/validacion-opinion.js';
import { handleValidationErrors } from '../../middlewares/validacion.js';

const router = Router();

// Rutas de opiniones (mismos endpoints públicos)
router.post(
  '/',
  validateJWT,
  validateCreateOpinion,
  handleValidationErrors,
  createOpinion
);

router.get('/', validateOpinionQuery, handleValidationErrors, getOpinions);

router.get('/:id', validateOpinionId, handleValidationErrors, getOpinionById);

router.put(
  '/:id',
  validateJWT,
  validateUpdateOpinion,
  handleValidationErrors,
  updateOpinion
);

router.delete('/:id', validateJWT, validateOpinionId, handleValidationErrors, deleteOpinion);

export default router;

import { body, param, query } from 'express-validator';

// Validadores para crear comentario
export const validateCreateComment = [
  body('opinionId')
    .notEmpty()
    .withMessage('El ID de la opinión es requerido')
    .isMongoId()
    .withMessage('ID de opinión inválido'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('El contenido es requerido')
    .isLength({ max: 500 })
    .withMessage('El comentario no puede exceder 500 caracteres'),
];

// Validadores para actualizar comentario
export const validateUpdateComment = [
  param('id').isMongoId().withMessage('ID de comentario inválido'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('El contenido es requerido')
    .isLength({ min: 1, max: 500 })
    .withMessage('El comentario debe tener entre 1 y 500 caracteres'),
];

// Validador para obtener comentario por ID
export const validateCommentId = [
  param('id').isMongoId().withMessage('ID de comentario inválido'),
];

// Validador para obtener comentarios de una opinión
export const validateGetCommentsByOpinion = [
  param('opinionId').isMongoId().withMessage('ID de opinión inválido'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
];

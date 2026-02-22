import { body, param, query } from 'express-validator';

// Validadores para crear opinión
export const validateCreateOpinion = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ max: 150 })
    .withMessage('El título no puede exceder 150 caracteres'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('La categoría es requerida')
    .isLength({ max: 50 })
    .withMessage('La categoría no puede exceder 50 caracteres'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('El contenido es requerido')
    .isLength({ max: 2000 })
    .withMessage('El contenido no puede exceder 2000 caracteres'),
];

// Validadores para actualizar opinión
export const validateUpdateOpinion = [
  param('id').isMongoId().withMessage('ID de opinión inválido'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('El título debe tener entre 1 y 150 caracteres'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('La categoría debe tener entre 1 y 50 caracteres'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El contenido debe tener entre 1 y 2000 caracteres'),
];

// Validador para obtener opinión por ID
export const validateOpinionId = [
  param('id').isMongoId().withMessage('ID de opinión inválido'),
];

// Validadores para query params
export const validateOpinionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Categoría inválida'),
  query('authorId')
    .optional()
    .isString()
    .withMessage('ID de autor inválido'),
];

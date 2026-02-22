import { Router } from 'express';
import {
  updateUserRole,
  getUserRoles,
  getUsersByRole,
  getProfile,
  updateProfile,
} from './user.controller.js';
import { validateUpdateProfile } from '../../middlewares/validacion.js';
import { upload, handleUploadError } from '../../helpers/subida-archivos.js';

const router = Router();

// Ruta para obtener el perfil del usuario actual autenticado
router.get('/profile/me', ...getProfile);

// Ruta para actualizar el perfil del usuario actual autenticado
router.put(
  '/profile/me',
  upload.single('profilePicture'),
  handleUploadError,
  validateUpdateProfile,
  ...updateProfile
);

router.get('/:userId/roles', ...getUserRoles);

// GET /api/v1/users/by-role/:roleName
router.get('/by-role/:roleName', ...getUsersByRole);

export default router;

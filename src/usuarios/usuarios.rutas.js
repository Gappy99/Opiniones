import { Router } from 'express';
import {
  updateUserRole,
  getUserRoles,
  getUsersByRole,
  getProfile,
  updateProfile,
} from './usuario.controlador.js';
import { validateUpdateProfile } from '../../middlewares/validacion.js';

const router = Router();

// Rutas de usuarios (manteniendo endpoints públicos)
router.get('/profile/me', ...getProfile);

router.put('/profile/me', validateUpdateProfile, ...updateProfile);
router.get('/:userId/roles', ...getUserRoles);

router.get('/by-role/:roleName', ...getUsersByRole);

export default router;

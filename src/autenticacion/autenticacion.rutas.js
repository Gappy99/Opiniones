import { Router } from 'express';
import * as authController from './auth.controlador.js';
import { validateJWT } from '../../middlewares/validar-JWT.js';
import {
  authRateLimit,
  requestLimit,
} from '../../middlewares/limite-peticiones.js';
import { upload, handleUploadError } from '../../helpers/subida-archivos.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
} from '../../middlewares/validacion.js';

const router = Router();

// Rutas de autenticación (mismas rutas públicas que antes)
router.post(
  '/register',
  authRateLimit,
  upload.single('profilePicture'),
  handleUploadError,
  validateRegister,
  authController.register
);

router.post('/login', authRateLimit, validateLogin, authController.login);

router.post(
  '/verify-email',
  requestLimit,
  validateVerifyEmail,
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  authRateLimit,
  validateResendVerification,
  authController.resendVerification
);

router.post(
  '/forgot-password',
  authRateLimit,
  validateForgotPassword,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimit,
  validateResetPassword,
  authController.resetPassword
);

router.get('/profile', validateJWT, authController.getProfile);

router.post('/profile/by-id', requestLimit, authController.getProfileById);

export default router;
